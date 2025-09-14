import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Label } from './label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Badge } from './badge';
import { 
  Upload, Download, FileText, AlertTriangle, CheckCircle, 
  X, RefreshCw, Eye, Clock, BarChart3,
  FileSpreadsheet, FileJson, Database
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Checkbox } from './checkbox';
import { 
  importExportService
} from '../../services/importExportService';
import { 
  devLogger,
  logImportStart,
  logImportProgress,
  logImportComplete,
  logExportStart,
  logExportComplete,
  logUserAction,
  startPerformanceTimer,
  endPerformanceTimer
} from '../../utils/developmentLogger';
import type { 
  ImportOptions, 
  ExportOptions, 
  ImportExportLog,
  ValidationResult 
} from '../../services/importExportService';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'variants' | 'specificVariants' | 'products' | 'hierarchy';
  data?: any[];
  onImportComplete?: (results: any) => void;
  onExportComplete?: (filename: string) => void;
}

export function ImportExportModal({
  isOpen,
  onClose,
  type,
  data = [],
  onImportComplete,
  onExportComplete
}: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'logs'>('import');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [logs, setLogs] = useState<ImportExportLog[]>([]);
  const [progress, setProgress] = useState(0);
  const modalOpenTime = useRef<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const logUserAction = (action: string, component: string, metadata?: any) => {
    devLogger.info('business', `User action: ${action}`, {
      component,
      action,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  };

  const handleCloseModal = () => {
    logUserAction('modal_close', 'ImportExportModal', { 
      type, 
      activeTab,
      duration: performance.now() - modalOpenTime.current
    });
    
    devLogger.info('ui', 'Import/Export modal closed', { 
      type,
      activeTab,
      sessionDuration: performance.now() - modalOpenTime.current
    });
    
    onClose();
  };

  // Log modal open event
  useEffect(() => {
    if (isOpen) {
      modalOpenTime.current = performance.now();
      logUserAction('modal_open', 'ImportExportModal', { type });
      devLogger.info('ui', 'Import/Export modal opened', { type });
    }
  }, [isOpen, type]);

  // Import options
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skipDuplicates: true,
    updateExisting: false,
    validateOnly: false,
    batchSize: 100,
    delimiter: ',',
    encoding: 'utf-8',
    skipEmptyRows: true,
    trimWhitespace: true,
  });

  // Export options
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeHeaders: true,
    includeMetadata: false,
    dateFormat: 'YYYY-MM-DD',
    numberFormat: 'standard',
    encoding: 'utf-8',
    compression: false,
  });

  useEffect(() => {
    if (isOpen) {
      setLogs(importExportService.getLogs());
    }
  }, [isOpen]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValidationResult(null);
    }
  };

  const handleValidateFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    
    const timerId = startPerformanceTimer('fileValidation', { 
      fileName: selectedFile.name,
      fileSize: selectedFile.size 
    });
    
    logUserAction('validate_start', 'ImportExportModal', { 
      type, 
      fileName: selectedFile.name,
      fileSize: selectedFile.size 
    });
    
    try {
      const logId = importExportService.createLog('import', type, {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        validateOnly: true
      });

      importExportService.updateLogStatus(logId, 'processing');

      const parsedData = await importExportService.parseCSV(selectedFile, importOptions);
      const validation = importExportService.validateImportData(parsedData, type);
      
      setValidationResult(validation);
      
      importExportService.updateProgress(logId, parsedData.length, validation.statistics.validRows, parsedData.length);
      importExportService.updateLogStatus(logId, validation.isValid ? 'completed' : 'failed');
      
      // Add errors and warnings to log
      validation.errors.forEach(error => {
        importExportService.addError(logId, error.row, error.message, error.field, error.value);
      });
      
      validation.warnings.forEach(warning => {
        importExportService.addWarning(logId, warning.row, warning.message, warning.field, warning.value);
      });

      setLogs(importExportService.getLogs());
      
      const duration = endPerformanceTimer(timerId) || 0;
      
      devLogger.info('import', 'File validation completed', {
        fileName: selectedFile.name,
        isValid: validation.isValid,
        totalRows: validation.statistics.totalRows,
        validRows: validation.statistics.validRows,
        invalidRows: validation.statistics.invalidRows,
        duplicateRows: validation.statistics.duplicateRows,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
        duration
      });
      
      logUserAction('validate_complete', 'ImportExportModal', {
        type,
        fileName: selectedFile.name,
        result: validation.isValid ? 'success' : 'failed',
        statistics: validation.statistics,
        duration
      });
    } catch (error: any) {
      endPerformanceTimer(timerId);
      devLogger.error('import', 'File validation failed', { 
        fileName: selectedFile.name, 
        error: error.message 
      });
      logUserAction('validate_error', 'ImportExportModal', { 
        type, 
        fileName: selectedFile.name, 
        error: error.message 
      });
      console.error('Validation failed:', error);
      alert(`❌ Validation failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !validationResult?.isValid) return;

    setIsProcessing(true);
    setProgress(0);
    
    const overallTimerId = startPerformanceTimer('importOperation', { 
      type, 
      fileName: selectedFile.name,
      fileSize: selectedFile.size 
    });
    
    logImportStart(type, selectedFile.name, selectedFile.size, importOptions);
    logUserAction('import_start', 'ImportExportModal', { type, fileName: selectedFile.name });
    
    try {
      const logId = importExportService.createLog('import', type, {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        options: importOptions
      });

      importExportService.updateLogStatus(logId, 'processing');

      const parsedData = await importExportService.parseCSV(selectedFile, importOptions);
      
      let results;
      const onProgress = (progress: number) => {
        setProgress(progress);
      };

      // Call the appropriate import method based on type
      switch (type) {
        case 'variants':
          results = await importExportService.importVariants(parsedData, onProgress);
          break;
        case 'specificVariants':
          results = await importExportService.importSpecificVariants(parsedData, onProgress);
          break;
        case 'products':
          results = await importExportService.importProducts(parsedData, onProgress);
          break;
        case 'hierarchy':
          results = await importExportService.importGraniteHierarchy(parsedData, onProgress);
          break;
        default:
          throw new Error(`Unsupported import type: ${type}`);
      }

      const duration = endPerformanceTimer(overallTimerId) || 0;
      
      setLogs(importExportService.getLogs());
      
      const result = {
        total: parsedData.length,
        successful: results.success,
        failed: results.errors.length,
        duration
      };
      
      logImportComplete(type, result);
      logUserAction('import_complete', 'ImportExportModal', result);
      
      onImportComplete?.(result);

      if (results.errors.length > 0) {
        alert(`⚠️ Import completed with warnings!\n${results.success} records imported successfully.\n${results.errors.length} records failed.\n\nCheck the logs for details.`);
      } else {
        alert(`✅ Import completed successfully! ${results.success} records imported.`);
      }
    } catch (error: any) {
      endPerformanceTimer(overallTimerId);
      devLogger.error('import', 'Import operation failed', { 
        type, 
        fileName: selectedFile.name, 
        error: error.message 
      });
      logUserAction('import_error', 'ImportExportModal', { type, error: error.message });
      console.error('Import failed:', error);
      alert(`❌ Import failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleExport = async () => {
    if (data.length === 0) {
      alert('❌ No data to export');
      return;
    }

    setIsProcessing(true);
    
    const overallTimerId = startPerformanceTimer('exportOperation', { 
      type, 
      recordCount: data.length,
      format: exportOptions.format 
    });
    
    logExportStart(type, data.length, exportOptions.format, exportOptions);
    logUserAction('export_start', 'ImportExportModal', { type, recordCount: data.length, format: exportOptions.format });
    
    try {
      const logId = importExportService.createLog('export', type, {
        recordCount: data.length,
        options: exportOptions
      });

      importExportService.updateLogStatus(logId, 'processing');

      let blob: Blob;
      let filename: string;

      switch (exportOptions.format) {
        case 'csv':
          blob = await importExportService.exportToCSV(data, exportOptions);
          filename = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'json':
          blob = await importExportService.exportToJSON(data, exportOptions);
          filename = `${type}_export_${new Date().toISOString().split('T')[0]}.json`;
          break;
        default:
          throw new Error(`Unsupported export format: ${exportOptions.format}`);
      }

      importExportService.downloadFile(blob, filename);
      importExportService.updateProgress(logId, data.length, data.length, data.length);
      importExportService.updateLogStatus(logId, 'completed');
      
      const duration = endPerformanceTimer(overallTimerId) || 0;
      
      setLogs(importExportService.getLogs());
      
      const result = {
        recordCount: data.length,
        fileName: filename,
        fileSize: blob.size,
        duration
      };
      
      logExportComplete(type, result);
      logUserAction('export_complete', 'ImportExportModal', result);
      
      onExportComplete?.(filename);
      alert(`✅ Export completed! File downloaded: ${filename}`);
    } catch (error: any) {
      endPerformanceTimer(overallTimerId);
      devLogger.error('export', 'Export operation failed', { 
        type, 
        recordCount: data.length, 
        error: error.message 
      });
      logUserAction('export_error', 'ImportExportModal', { type, error: error.message });
      console.error('Export failed:', error);
      alert(`❌ Export failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    logUserAction('download_template', 'ImportExportModal', { type });
    
    const template = importExportService.generateTemplate(type);
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const filename = `${type}_template.csv`;
    importExportService.downloadFile(blob, filename);
    
    devLogger.info('export', 'Template downloaded', { 
      type, 
      filename, 
      size: blob.size 
    });
    
    alert(`✅ Template downloaded: ${filename}`);
  };

  const handleDownloadLogs = async () => {
    logUserAction('download_logs', 'ImportExportModal', { type });
    
    try {
      const blob = await importExportService.exportLogs();
      const filename = `import_export_logs_${new Date().toISOString().split('T')[0]}.json`;
      importExportService.downloadFile(blob, filename);
      
      devLogger.info('export', 'Logs exported', { 
        filename, 
        size: blob.size 
      });
      
      alert(`✅ Logs exported: ${filename}`);
    } catch (error: any) {
      devLogger.error('export', 'Failed to export logs', { error: error.message });
      console.error('Failed to export logs:', error);
      alert(`❌ Failed to export logs: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">
              📊 Advanced Import/Export - {type.charAt(0).toUpperCase() + type.slice(1)}
            </h2>
            <p className="text-gray-600 mt-1">
              Professional-grade data management with comprehensive logging
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCloseModal}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => {
          const newTab = value as 'import' | 'export' | 'logs';
          logUserAction('tab_change', 'ImportExportModal', { 
            from: activeTab, 
            to: newTab, 
            type 
          });
          setActiveTab(newTab);
        }} className="p-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import Data
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Operation Logs
            </TabsTrigger>
          </TabsList>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-blue-500" />
                  📁 File Upload & Validation
                </CardTitle>
                <CardDescription>
                  Upload your CSV file and validate data before importing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Select CSV File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={handleDownloadTemplate}
                      size="sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Template
                    </Button>
                  </div>
                  {selectedFile && (
                    <div className="text-sm text-gray-600">
                      📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>

                {/* Import Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <Label>Delimiter</Label>
                    <Select
                      value={importOptions.delimiter}
                      onValueChange={(value) => setImportOptions(prev => ({
                        ...prev,
                        delimiter: value as any
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=",">Comma (,)</SelectItem>
                        <SelectItem value=";">Semicolon (;)</SelectItem>
                        <SelectItem value="\t">Tab</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Encoding</Label>
                    <Select
                      value={importOptions.encoding}
                      onValueChange={(value) => setImportOptions(prev => ({
                        ...prev,
                        encoding: value as any
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utf-8">UTF-8</SelectItem>
                        <SelectItem value="iso-8859-1">ISO-8859-1</SelectItem>
                        <SelectItem value="windows-1252">Windows-1252</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={importOptions.skipDuplicates}
                      onCheckedChange={(checked) => setImportOptions(prev => ({
                        ...prev,
                        skipDuplicates: !!checked
                      }))}
                    />
                    <Label>Skip Duplicates</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={importOptions.updateExisting}
                      onCheckedChange={(checked) => setImportOptions(prev => ({
                        ...prev,
                        updateExisting: !!checked
                      }))}
                    />
                    <Label>Update Existing</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={importOptions.skipEmptyRows}
                      onCheckedChange={(checked) => setImportOptions(prev => ({
                        ...prev,
                        skipEmptyRows: !!checked
                      }))}
                    />
                    <Label>Skip Empty Rows</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={importOptions.trimWhitespace}
                      onCheckedChange={(checked) => setImportOptions(prev => ({
                        ...prev,
                        trimWhitespace: !!checked
                      }))}
                    />
                    <Label>Trim Whitespace</Label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleValidateFile}
                    disabled={!selectedFile || isProcessing}
                    variant="outline"
                  >
                    {isProcessing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    Validate
                  </Button>
                  
                  <Button
                    onClick={handleImport}
                    disabled={!selectedFile || !validationResult?.isValid || isProcessing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Importing... {progress.toFixed(0)}%
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Data
                      </>
                    )}
                  </Button>
                </div>

                {/* Progress Bar */}
                {isProcessing && progress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Validation Results */}
            {validationResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {validationResult.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                    🔍 Validation Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {validationResult.statistics.totalRows}
                      </div>
                      <div className="text-sm text-gray-600">Total Rows</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {validationResult.statistics.validRows}
                      </div>
                      <div className="text-sm text-gray-600">Valid Rows</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {validationResult.statistics.invalidRows}
                      </div>
                      <div className="text-sm text-gray-600">Invalid Rows</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {validationResult.statistics.duplicateRows}
                      </div>
                      <div className="text-sm text-gray-600">Duplicates</div>
                    </div>
                  </div>

                  {validationResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-red-600">❌ Errors ({validationResult.errors.length})</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {validationResult.errors.slice(0, 10).map((error, index) => (
                          <div key={index} className="text-sm p-2 bg-red-50 rounded border-l-4 border-red-500">
                            <strong>Row {error.row}:</strong> {error.message}
                            {error.field && <span className="text-gray-600"> (Field: {error.field})</span>}
                          </div>
                        ))}
                        {validationResult.errors.length > 10 && (
                          <div className="text-sm text-gray-500 italic">
                            ... and {validationResult.errors.length - 10} more errors
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {validationResult.warnings.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h4 className="font-medium text-yellow-600">⚠️ Warnings ({validationResult.warnings.length})</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {validationResult.warnings.slice(0, 5).map((warning, index) => (
                          <div key={index} className="text-sm p-2 bg-yellow-50 rounded border-l-4 border-yellow-500">
                            <strong>Row {warning.row}:</strong> {warning.message}
                            {warning.field && <span className="text-gray-600"> (Field: {warning.field})</span>}
                          </div>
                        ))}
                        {validationResult.warnings.length > 5 && (
                          <div className="text-sm text-gray-500 italic">
                            ... and {validationResult.warnings.length - 5} more warnings
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-green-500" />
                  📤 Data Export Configuration
                </CardTitle>
                <CardDescription>
                  Configure export options and download your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Export Format</Label>
                    <Select
                      value={exportOptions.format}
                      onValueChange={(value) => setExportOptions(prev => ({
                        ...prev,
                        format: value as any
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                        <SelectItem value="json">JSON (JavaScript Object)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Encoding</Label>
                    <Select
                      value={exportOptions.encoding}
                      onValueChange={(value) => setExportOptions(prev => ({
                        ...prev,
                        encoding: value as any
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utf-8">UTF-8</SelectItem>
                        <SelectItem value="iso-8859-1">ISO-8859-1</SelectItem>
                        <SelectItem value="windows-1252">Windows-1252</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={exportOptions.includeHeaders}
                      onCheckedChange={(checked) => setExportOptions(prev => ({
                        ...prev,
                        includeHeaders: !!checked
                      }))}
                    />
                    <Label>Include Headers</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={exportOptions.includeMetadata}
                      onCheckedChange={(checked) => setExportOptions(prev => ({
                        ...prev,
                        includeMetadata: !!checked
                      }))}
                    />
                    <Label>Include Metadata</Label>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Export Statistics</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    📊 Ready to export {data.length} {type} records
                  </div>
                </div>

                <Button
                  onClick={handleExport}
                  disabled={data.length === 0 || isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export {data.length} Records
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  📋 Operation History & Logs
                </CardTitle>
                <CardDescription>
                  View detailed logs of all import/export operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <Badge variant="secondary">
                    {logs.length} Operations Logged
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadLogs}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Logs
                  </Button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      📝 No operations logged yet
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              {log.operation === 'import' ? (
                                <Upload className="h-4 w-4 text-blue-500" />
                              ) : (
                                <Download className="h-4 w-4 text-green-500" />
                              )}
                              <span className="font-medium">
                                {log.operation.toUpperCase()} {log.type}
                              </span>
                              <Badge
                                variant={
                                  log.status === 'completed' ? 'default' :
                                  log.status === 'failed' ? 'destructive' :
                                  log.status === 'processing' ? 'secondary' : 'outline'
                                }
                              >
                                {log.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              {log.startTime.toLocaleString()}
                              {log.endTime && ` - ${log.endTime.toLocaleString()}`}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Total:</span>
                            <div className="font-medium">{log.totalRecords}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Processed:</span>
                            <div className="font-medium">{log.processedRecords}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Success:</span>
                            <div className="font-medium text-green-600">{log.successfulRecords}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Failed:</span>
                            <div className="font-medium text-red-600">{log.failedRecords}</div>
                          </div>
                        </div>

                        {(log.errors.length > 0 || log.warnings.length > 0) && (
                          <div className="text-sm space-y-1">
                            {log.errors.length > 0 && (
                              <div className="text-red-600">
                                ❌ {log.errors.length} error(s)
                              </div>
                            )}
                            {log.warnings.length > 0 && (
                              <div className="text-yellow-600">
                                ⚠️ {log.warnings.length} warning(s)
                              </div>
                            )}
                          </div>
                        )}

                        {log.fileName && (
                          <div className="text-sm text-gray-600">
                            📁 {log.fileName} 
                            {log.fileSize && ` (${(log.fileSize / 1024).toFixed(1)} KB)`}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
