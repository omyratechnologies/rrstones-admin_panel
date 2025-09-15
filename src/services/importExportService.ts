// Advanced Import/Export Service with Logging
import { 
  devLogger, 
  startPerformanceTimer, 
  endPerformanceTimer 
} from '../utils/developmentLogger';
import { graniteApi } from './graniteApi';
import type { 
  GraniteVariant, 
  SpecificGraniteVariant, 
  GraniteProduct
} from '@/types';
export interface ImportExportLog {
  id: string;
  operation: 'import' | 'export';
  type: 'variants' | 'specificVariants' | 'products' | 'full';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: Array<{
    row: number;
    field?: string;
    message: string;
    data?: any;
  }>;
  warnings: Array<{
    row: number;
    field?: string;
    message: string;
    data?: any;
  }>;
  fileName?: string;
  fileSize?: number;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ImportOptions {
  skipDuplicates: boolean;
  updateExisting: boolean;
  validateOnly: boolean;
  batchSize: number;
  delimiter: ',' | ';' | '\t';
  encoding: 'utf-8' | 'iso-8859-1' | 'windows-1252';
  skipEmptyRows: boolean;
  trimWhitespace: boolean;
  customMapping?: Record<string, string>;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json' | 'xml';
  includeHeaders: boolean;
  includeMetadata: boolean;
  dateFormat: string;
  numberFormat: string;
  encoding: 'utf-8' | 'iso-8859-1' | 'windows-1252';
  compression: boolean;
  customFields?: string[];
  filters?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    value: any;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    message: string;
    value: any;
  }>;
  statistics: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
  };
}

class ImportExportService {
  private logs: ImportExportLog[] = [];
  private currentLog: ImportExportLog | null = null;

  // Create a new operation log
  createLog(operation: 'import' | 'export', type: string, metadata?: Record<string, any>): string {
    const log: ImportExportLog = {
      id: Date.now().toString(),
      operation,
      type: type as any,
      fileName: metadata?.fileName || '',
      startTime: new Date(),
      status: 'processing',
      totalRecords: metadata?.totalRows || 0,
      processedRecords: 0,
      successfulRecords: 0,
      failedRecords: 0,
      errors: [],
      warnings: [],
      metadata: metadata || {}
    };
    
    this.logs.push(log);
    this.saveLogs();
    return log.id;
  }

  updateLog(logId: string, updates: Partial<ImportExportLog>): void {
    const logIndex = this.logs.findIndex(log => log.id === logId);
    if (logIndex !== -1) {
      this.logs[logIndex] = { 
        ...this.logs[logIndex], 
        ...updates,
        endTime: updates.status === 'completed' ? new Date() : this.logs[logIndex].endTime
      };
      this.saveLogs();
    }
  }

  private saveLogs(): void {
    try {
      localStorage.setItem('import_export_logs', JSON.stringify(this.logs));
    } catch (error) {
      devLogger.error('import', 'Failed to save logs to localStorage', { error });
    }
  }

  // Update operation status
  updateLogStatus(logId: string, status: ImportExportLog['status']) {
    const log = this.logs.find(l => l.id === logId);
    if (log) {
      log.status = status;
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        log.endTime = new Date();
      }
      this.logOperation('info', `Operation ${status}`, { logId, status });
    }
  }

  // Add error to log
  addError(logId: string, row: number, message: string, field?: string, data?: any) {
    const log = this.logs.find(l => l.id === logId);
    if (log) {
      log.errors.push({ row, field, message, data });
      log.failedRecords++;
      this.logOperation('error', message, { logId, row, field, data });
    }
  }

  // Add warning to log
  addWarning(logId: string, row: number, message: string, field?: string, data?: any) {
    const log = this.logs.find(l => l.id === logId);
    if (log) {
      log.warnings.push({ row, field, message, data });
      this.logOperation('warn', message, { logId, row, field, data });
    }
  }

  // Update progress
  updateProgress(logId: string, processed: number, successful: number, total: number) {
    const log = this.logs.find(l => l.id === logId);
    if (log) {
      log.processedRecords = processed;
      log.successfulRecords = successful;
      log.totalRecords = total;
      log.failedRecords = processed - successful;
    }
  }

  // Parse CSV file
  async parseCSV(file: File, options: ImportOptions): Promise<any[]> {
    const timerId = startPerformanceTimer('parseCSV', { fileName: file.name, fileSize: file.size });
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          devLogger.debug('import', 'Starting CSV parsing', { fileName: file.name, options });
          
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => 
            options.skipEmptyRows ? line.trim() !== '' : true
          );
          
          if (lines.length === 0) {
            devLogger.error('import', 'CSV file is empty', { fileName: file.name });
            reject(new Error('File is empty'));
            return;
          }

          const headers = lines[0].split(options.delimiter).map(h => 
            options.trimWhitespace ? h.trim().replace(/['"]/g, '') : h.replace(/['"]/g, '')
          );
          
          devLogger.debug('import', 'CSV headers detected', { headers, headerCount: headers.length });
          
          const data = lines.slice(1).map((line, index) => {
            const values = line.split(options.delimiter).map(v => 
              options.trimWhitespace ? v.trim().replace(/['"]/g, '') : v.replace(/['"]/g, '')
            );
            
            const row: any = {};
            headers.forEach((header, i) => {
              const mappedHeader = options.customMapping?.[header] || header;
              row[mappedHeader] = values[i] || '';
            });
            row._rowIndex = index + 2; // +2 because we start from line 1 and skip header
            
            return row;
          }).filter(row => {
            // Filter out completely empty rows
            if (options.skipEmptyRows) {
              return Object.values(row).some(value => 
                value !== '' && value !== undefined && value !== null
              );
            }
            return true;
          });

          endPerformanceTimer(timerId);
          devLogger.info('import', 'CSV parsing completed', { 
            fileName: file.name, 
            totalRows: data.length,
            headerCount: headers.length 
          });
          
          resolve(data);
        } catch (error) {
          endPerformanceTimer(timerId);
          devLogger.error('import', 'CSV parsing failed', { fileName: file.name, error });
          reject(error);
        }
      };

      reader.onerror = () => {
        endPerformanceTimer(timerId);
        devLogger.error('import', 'Failed to read file', { fileName: file.name });
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file, options.encoding);
    });
  }

  // Validate import data
  validateImportData(data: any[], type: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      statistics: {
        totalRows: data.length,
        validRows: 0,
        invalidRows: 0,
        duplicateRows: 0
      }
    };

    const seen = new Set();
    
    data.forEach((row, index) => {
      const rowNumber = row._rowIndex || index + 1;
      let rowValid = true;

      // Type-specific validation
      if (type === 'variants') {
        if (!row.name || row.name.trim() === '') {
          result.errors.push({
            row: rowNumber,
            field: 'name',
            message: 'Name is required',
            value: row.name
          });
          rowValid = false;
        }
      } else if (type === 'products') {
        if (!row.name || row.name.trim() === '') {
          result.errors.push({
            row: rowNumber,
            field: 'name',
            message: 'Product name is required',
            value: row.name
          });
          rowValid = false;
        }
        
        if (row.basePrice && isNaN(parseFloat(row.basePrice))) {
          result.errors.push({
            row: rowNumber,
            field: 'basePrice',
            message: 'Base price must be a valid number',
            value: row.basePrice
          });
          rowValid = false;
        }
        
        if (row.stock && isNaN(parseInt(row.stock))) {
          result.errors.push({
            row: rowNumber,
            field: 'stock',
            message: 'Stock must be a valid number',
            value: row.stock
          });
          rowValid = false;
        }
      }

      // Check for duplicates
      const key = row.name?.toLowerCase().trim();
      if (key && seen.has(key)) {
        result.warnings.push({
          row: rowNumber,
          field: 'name',
          message: 'Duplicate name found',
          value: row.name
        });
        result.statistics.duplicateRows++;
      } else if (key) {
        seen.add(key);
      }

      if (rowValid) {
        result.statistics.validRows++;
      } else {
        result.statistics.invalidRows++;
      }
    });

    result.isValid = result.errors.length === 0;
    return result;
  }

  // Generate CSV template
  generateTemplate(type: string): string {
    const templates = {
      variants: 'name,description,image\n"Black Galaxy","Premium black granite",""\n"Kashmir White","White granite with veining",""',
      specificVariants: 'name,description,image,variantId\n"Premium Grade","High quality grade","",""\n"Standard Grade","Standard quality grade","",""',
      products: 'name,basePrice,stock,unit,status,specificVariantId\n"Black Galaxy Slab",5000,10,"sq_ft","active",""\n"White Granite Tile",1200,25,"sq_ft","active",""',
      hierarchy: 'variant_name,variant_description,specific_name,specific_description,product_name,product_price,product_stock,product_unit\n"Black Galaxy","Premium black granite","Premium Grade","High quality","Slab 60x30",5000,10,"sq_ft"'
    };
    
    return templates[type as keyof typeof templates] || '';
  }

  // Import Methods - Save to Server
  async importVariants(data: GraniteVariant[], onProgress?: (progress: number) => void): Promise<{ success: number; errors: any[] }> {
    const timerId = startPerformanceTimer('import_variants');
    const logId = this.createLog('import', 'variants', { totalRows: data.length });
    
    devLogger.info('import', 'Starting variants import', { count: data.length });
    
    const results = { success: 0, errors: [] as any[] };
    
    for (let i = 0; i < data.length; i++) {
      const variant = data[i];
      const progress = ((i + 1) / data.length) * 100;
      
      try {
        // Remove any CSV-specific fields
        const cleanVariant = {
          name: variant.name,
          description: variant.description || '',
          image: variant.image || ''
        };
        
        const response = await graniteApi.createVariant(cleanVariant);
        // Check if the response has data (indicates success)
        if (response && response.data) {
          results.success++;
          devLogger.info('import', 'Variant imported successfully', { name: variant.name, id: response.data._id });
        } else {
          results.errors.push({ row: i + 1, error: response?.message || 'Unknown error', data: variant });
          devLogger.warn('import', 'Variant import failed', { name: variant.name, error: response?.message });
        }
      } catch (error: any) {
        results.errors.push({ row: i + 1, error: error.message, data: variant });
        devLogger.error('import', 'Variant import error', { name: variant.name, error: error.message });
      }
      
      if (onProgress) {
        onProgress(progress);
      }
    }
    
    this.updateLog(logId, { 
      status: 'completed', 
      successfulRecords: results.success,
      failedRecords: results.errors.length,
      processedRecords: data.length
    });
    
    endPerformanceTimer(timerId);
    devLogger.info('import', 'Variants import completed', { 
      success: results.success, 
      errors: results.errors.length 
    });
    
    return results;
  }

  async importSpecificVariants(data: SpecificGraniteVariant[], onProgress?: (progress: number) => void): Promise<{ success: number; errors: any[] }> {
    const timerId = startPerformanceTimer('import_specific_variants');
    const logId = this.createLog('import', 'specificVariants', { totalRows: data.length });
    
    devLogger.info('import', 'Starting specific variants import', { count: data.length });
    
    const results = { success: 0, errors: [] as any[] };
    
    for (let i = 0; i < data.length; i++) {
      const specificVariant = data[i];
      const progress = ((i + 1) / data.length) * 100;
      
      try {
        const cleanSpecificVariant = {
          name: specificVariant.name,
          description: specificVariant.description || '',
          image: specificVariant.image || '',
          variantId: specificVariant.variantId
        };
        
        const response = await graniteApi.createSpecificVariant(cleanSpecificVariant);
        if (response && response.data) {
          results.success++;
          devLogger.info('import', 'Specific variant imported successfully', { name: specificVariant.name, id: response.data._id });
        } else {
          results.errors.push({ row: i + 1, error: response?.message || 'Unknown error', data: specificVariant });
          devLogger.warn('import', 'Specific variant import failed', { name: specificVariant.name, error: response?.message });
        }
      } catch (error: any) {
        results.errors.push({ row: i + 1, error: error.message, data: specificVariant });
        devLogger.error('import', 'Specific variant import error', { name: specificVariant.name, error: error.message });
      }
      
      if (onProgress) {
        onProgress(progress);
      }
    }
    
    this.updateLog(logId, { 
      status: 'completed', 
      successfulRecords: results.success,
      failedRecords: results.errors.length,
      processedRecords: data.length
    });
    
    endPerformanceTimer(timerId);
    devLogger.info('import', 'Specific variants import completed', { 
      success: results.success, 
      errors: results.errors.length 
    });
    
    return results;
  }

  async importProducts(data: GraniteProduct[], onProgress?: (progress: number) => void): Promise<{ success: number; errors: any[] }> {
    const timerId = startPerformanceTimer('import_products');
    const logId = this.createLog('import', 'products', { totalRows: data.length });
    
    devLogger.info('import', 'Starting products import', { count: data.length });
    
    const results = { success: 0, errors: [] as any[] };
    
    for (let i = 0; i < data.length; i++) {
      const product = data[i];
      const progress = ((i + 1) / data.length) * 100;
      
      try {
        const cleanProduct = {
          name: product.name,
          basePrice: parseFloat(product.basePrice?.toString() || '0'),
          stock: parseInt(product.stock?.toString() || '0'),
          unit: product.unit || 'sq_ft',
          status: product.status || 'active',
          variantSpecificId: (product as any).specificVariantId || (product as any).variantSpecificId || '',
          finish: (product as any).finish ? [(product as any).finish] : ['polished'],
          dimensions: (product as any).dimensions || [],
          images: (product as any).image ? [(product as any).image] : [],
          applications: (product as any).applications || []
        };
        
        const response = await graniteApi.createProduct(cleanProduct);
        if (response && response.data) {
          results.success++;
          devLogger.info('import', 'Product imported successfully', { name: product.name, id: response.data._id });
        } else {
          results.errors.push({ row: i + 1, error: response?.message || 'Unknown error', data: product });
          devLogger.warn('import', 'Product import failed', { name: product.name, error: response?.message });
        }
      } catch (error: any) {
        results.errors.push({ row: i + 1, error: error.message, data: product });
        devLogger.error('import', 'Product import error', { name: product.name, error: error.message });
      }
      
      if (onProgress) {
        onProgress(progress);
      }
    }
    
    this.updateLog(logId, { 
      status: 'completed', 
      successfulRecords: results.success,
      failedRecords: results.errors.length,
      processedRecords: data.length
    });
    
    endPerformanceTimer(timerId);
    devLogger.info('import', 'Products import completed', { 
      success: results.success, 
      errors: results.errors.length 
    });
    
    return results;
  }

  // Import Granite Hierarchy (Full Structure)
  async importGraniteHierarchy(data: any[], onProgress?: (progress: number) => void): Promise<{ success: number; errors: any[] }> {
    const timerId = startPerformanceTimer('import_hierarchy');
    const logId = this.createLog('import', 'hierarchy', { totalRows: data.length });
    
    devLogger.info('import', 'Starting granite hierarchy import', { count: data.length });
    
    const results = { success: 0, errors: [] as any[] };
    const variantMap = new Map<string, string>(); // name -> id
    const specificVariantMap = new Map<string, string>(); // name -> id
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const progress = ((i + 1) / data.length) * 100;
      
      try {
        // Step 1: Create or get variant
        let variantId = variantMap.get(row.variant_name);
        if (!variantId) {
          try {
            const variantResponse = await graniteApi.createVariant({
              name: row.variant_name,
              description: row.variant_description || '',
              image: ''
            });
            
            if (variantResponse && variantResponse.data) {
              variantId = variantResponse.data._id;
              variantMap.set(row.variant_name, variantId);
              devLogger.info('import', 'Created variant in hierarchy', { name: row.variant_name });
            }
          } catch (error) {
            // Variant might already exist, try to find it
            devLogger.warn('import', 'Variant creation failed, might already exist', { name: row.variant_name });
          }
        }
        
        // Step 2: Create or get specific variant
        let specificVariantId = specificVariantMap.get(`${row.variant_name}-${row.specific_name}`);
        if (!specificVariantId && variantId) {
          try {
            const specificResponse = await graniteApi.createSpecificVariant({
              name: row.specific_name,
              description: row.specific_description || '',
              variantId: variantId,
              image: ''
            });
            
            if (specificResponse && specificResponse.data) {
              specificVariantId = specificResponse.data._id;
              specificVariantMap.set(`${row.variant_name}-${row.specific_name}`, specificVariantId);
              devLogger.info('import', 'Created specific variant in hierarchy', { name: row.specific_name });
            }
          } catch (error) {
            devLogger.warn('import', 'Specific variant creation failed', { name: row.specific_name });
          }
        }
        
        // Step 3: Create product
        if (specificVariantId) {
          try {
            const productResponse = await graniteApi.createProduct({
              name: row.product_name,
              basePrice: parseFloat(row.product_price?.toString() || '0'),
              stock: parseInt(row.product_stock?.toString() || '0'),
              unit: row.product_unit || 'sq_ft',
              status: 'active',
              variantSpecificId: specificVariantId,
              finish: ['polished'],
              dimensions: [],
              images: [],
              applications: []
            });
            
            if (productResponse && productResponse.data) {
              results.success++;
              devLogger.info('import', 'Created product in hierarchy', { name: row.product_name });
            } else {
              results.errors.push({ row: i + 1, error: productResponse?.message || 'Product creation failed', data: row });
            }
          } catch (error: any) {
            results.errors.push({ row: i + 1, error: `Product creation failed: ${error.message}`, data: row });
          }
        } else {
          results.errors.push({ row: i + 1, error: 'Failed to create variant/specific variant hierarchy', data: row });
        }
        
      } catch (error: any) {
        results.errors.push({ row: i + 1, error: error.message, data: row });
        devLogger.error('import', 'Hierarchy import error', { row: i + 1, error: error.message });
      }
      
      if (onProgress) {
        onProgress(progress);
      }
    }
    
    this.updateLog(logId, { 
      status: 'completed', 
      successfulRecords: results.success,
      failedRecords: results.errors.length,
      processedRecords: data.length
    });
    
    endPerformanceTimer(timerId);
    devLogger.info('import', 'Granite hierarchy import completed', { 
      success: results.success, 
      errors: results.errors.length 
    });
    
    return results;
  }

  // Export data to CSV
  async exportToCSV(data: any[], options: ExportOptions): Promise<Blob> {
    const timerId = startPerformanceTimer('exportToCSV', { recordCount: data.length, format: 'csv' });
    
    try {
      devLogger.debug('export', 'Starting CSV export', { recordCount: data.length, options });
      
      let csv = '';
      
      if (data.length === 0) {
        endPerformanceTimer(timerId);
        devLogger.error('export', 'No data to export');
        throw new Error('No data to export');
      }

      // Get headers
      const headers = options.customFields || Object.keys(data[0]);
      devLogger.debug('export', 'CSV headers prepared', { headers, headerCount: headers.length });
      
      if (options.includeHeaders) {
        csv += headers.join(',') + '\n';
      }

      // Add data rows
      data.forEach((row, index) => {
        const values = headers.map(header => {
          let value = row[header];
          
          if (value === null || value === undefined) {
            value = '';
          } else if (typeof value === 'string') {
            // Escape quotes and wrap in quotes if contains comma or quote
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              value = '"' + value.replace(/"/g, '""') + '"';
            }
          } else if (value instanceof Date) {
            value = value.toLocaleDateString();
          }
          
          return value;
        });
        
        csv += values.join(',') + '\n';
        
        // Log progress for large exports
        if (index % 1000 === 0 && index > 0) {
          devLogger.debug('export', 'CSV export progress', { processed: index + 1, total: data.length });
        }
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      
      endPerformanceTimer(timerId);
      devLogger.info('export', 'CSV export completed', { 
        recordCount: data.length, 
        fileSize: blob.size,
        headerCount: headers.length 
      });
      
      return blob;
    } catch (error) {
      endPerformanceTimer(timerId);
      devLogger.error('export', 'CSV export failed', { error, recordCount: data.length });
      throw error;
    }
  }

  // Export data to JSON
  async exportToJSON(data: any[], options: ExportOptions): Promise<Blob> {
    const timerId = startPerformanceTimer('exportToJSON', { recordCount: data.length, format: 'json' });
    
    try {
      devLogger.debug('export', 'Starting JSON export', { recordCount: data.length, options });
      
      const exportData = {
        metadata: options.includeMetadata ? {
          exportedAt: new Date().toISOString(),
          totalRecords: data.length,
          format: 'json',
          version: '1.0'
        } : undefined,
        data: options.customFields ? 
          data.map(row => {
            const filtered: any = {};
            options.customFields!.forEach(field => {
              filtered[field] = row[field];
            });
            return filtered;
          }) : data
      };

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      
      endPerformanceTimer(timerId);
      devLogger.info('export', 'JSON export completed', { 
        recordCount: data.length, 
        fileSize: blob.size,
        includeMetadata: options.includeMetadata 
      });
      
      return blob;
    } catch (error) {
      endPerformanceTimer(timerId);
      devLogger.error('export', 'JSON export failed', { error, recordCount: data.length });
      throw error;
    }
  }

  // Download file
  downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Get operation logs
  getLogs(): ImportExportLog[] {
    return [...this.logs].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  // Get log by ID
  getLog(logId: string): ImportExportLog | undefined {
    return this.logs.find(l => l.id === logId);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    this.currentLog = null;
  }

  // Generate unique ID
  // private generateId(): string {
  //   return Date.now().toString(36) + Math.random().toString(36).substr(2);
  // }

  // Enhanced logging with different levels
  private logOperation(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      operation: this.currentLog?.operation,
      type: this.currentLog?.type
    };

    // Console logging with colors
    const colors = {
      info: '\x1b[34m', // Blue
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
    };
    
    console.log(
      `${colors[level]}[${level.toUpperCase()}]${'\x1b[0m'} ${timestamp} - ${message}`,
      data ? data : ''
    );

    // Store in localStorage for persistence
    try {
      const existingLogs = JSON.parse(localStorage.getItem('graniteImportExportLogs') || '[]');
      existingLogs.push(logEntry);
      
      // Keep only last 1000 logs
      if (existingLogs.length > 1000) {
        existingLogs.splice(0, existingLogs.length - 1000);
      }
      
      localStorage.setItem('graniteImportExportLogs', JSON.stringify(existingLogs));
    } catch (error) {
      console.error('Failed to store log entry:', error);
    }
  }

  // Get detailed logs from localStorage
  getDetailedLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem('graniteImportExportLogs') || '[]');
    } catch (error) {
      console.error('Failed to retrieve logs:', error);
      return [];
    }
  }

  // Export logs
  async exportLogs(): Promise<Blob> {
    const logs = this.getDetailedLogs();
    return this.exportToJSON(logs, {
      format: 'json',
      includeHeaders: true,
      includeMetadata: true,
      dateFormat: 'ISO',
      numberFormat: 'standard',
      encoding: 'utf-8',
      compression: false
    });
  }
}

export const importExportService = new ImportExportService();
