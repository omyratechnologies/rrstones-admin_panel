// Advanced Development & Production Logging System
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type LogCategory = 'import' | 'export' | 'api' | 'ui' | 'performance' | 'business' | 'security';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  operation?: string;
  duration?: number;
  stackTrace?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class DevelopmentLogger {
  private logs: LogEntry[] = [];
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
  private isProduction = process.env.NODE_ENV === 'production';
  private sessionId = this.generateSessionId();
  private logBuffer: LogEntry[] = [];
  private bufferSize = 100;
  private flushInterval = 30000; // 30 seconds

  constructor() {
    this.startPeriodicFlush();
    this.initializeGlobalErrorHandling();
  }

  // Core logging method
  log(level: LogLevel, category: LogCategory, message: string, data?: any, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      metadata
    };

    // Add stack trace for errors
    if (level === 'error' || level === 'critical') {
      entry.stackTrace = new Error().stack;
    }

    this.logs.push(entry);
    this.logBuffer.push(entry);

    // Console output with colors
    this.outputToConsole(entry);

    // Store in localStorage for persistence
    this.persistLog(entry);

    // Flush buffer if it's full
    if (this.logBuffer.length >= this.bufferSize) {
      this.flushLogs();
    }

    // Send critical errors immediately
    if (level === 'critical') {
      this.sendToServer([entry]);
    }
  }

  // Convenience methods
  debug(category: LogCategory, message: string, data?: any, metadata?: Record<string, any>) {
    if (!this.isProduction) {
      this.log('debug', category, message, data, metadata);
    }
  }

  info(category: LogCategory, message: string, data?: any, metadata?: Record<string, any>) {
    this.log('info', category, message, data, metadata);
  }

  warn(category: LogCategory, message: string, data?: any, metadata?: Record<string, any>) {
    this.log('warn', category, message, data, metadata);
  }

  error(category: LogCategory, message: string, data?: any, metadata?: Record<string, any>) {
    this.log('error', category, message, data, metadata);
  }

  critical(category: LogCategory, message: string, data?: any, metadata?: Record<string, any>) {
    this.log('critical', category, message, data, metadata);
  }

  // Performance monitoring
  startPerformanceTimer(name: string, metadata?: Record<string, any>): string {
    const metric: PerformanceMetrics = {
      name,
      startTime: performance.now(),
      metadata
    };
    
    const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.performanceMetrics.set(id, metric);
    
    this.debug('performance', `Started performance timer: ${name}`, { timerId: id, metadata });
    return id;
  }

  endPerformanceTimer(id: string): number | null {
    const metric = this.performanceMetrics.get(id);
    if (!metric) {
      this.warn('performance', `Performance timer not found: ${id}`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    this.info('performance', `Performance timer completed: ${metric.name}`, {
      timerId: id,
      duration: metric.duration,
      startTime: metric.startTime,
      endTime: metric.endTime,
      metadata: metric.metadata
    });

    // Warn if operation is slow
    if (metric.duration > 1000) { // 1 second
      this.warn('performance', `Slow operation detected: ${metric.name}`, {
        duration: metric.duration,
        threshold: 1000
      });
    }

    this.performanceMetrics.delete(id);
    return metric.duration;
  }

  // Business operation logging
  logBusinessOperation(operation: string, result: 'success' | 'failure', data?: any, duration?: number) {
    this.info('business', `Business operation: ${operation}`, {
      operation,
      result,
      duration,
      data
    });

    // Track business metrics
    this.trackBusinessMetric(operation, result, duration);
  }

  // Import/Export specific logging
  logImportStart(type: string, fileName: string, fileSize: number, options: any) {
    this.info('import', `Import started: ${type}`, {
      fileName,
      fileSize,
      options,
      operation: 'import_start'
    });
  }

  logImportProgress(type: string, processed: number, total: number, errors: number) {
    const progress = (processed / total) * 100;
    this.info('import', `Import progress: ${type}`, {
      processed,
      total,
      errors,
      progress: `${progress.toFixed(1)}%`,
      operation: 'import_progress'
    });
  }

  logImportComplete(type: string, result: { total: number; successful: number; failed: number; duration: number }) {
    this.info('import', `Import completed: ${type}`, {
      ...result,
      successRate: `${((result.successful / result.total) * 100).toFixed(1)}%`,
      operation: 'import_complete'
    });
  }

  logExportStart(type: string, recordCount: number, format: string, options: any) {
    this.info('export', `Export started: ${type}`, {
      recordCount,
      format,
      options,
      operation: 'export_start'
    });
  }

  logExportComplete(type: string, result: { recordCount: number; fileName: string; fileSize: number; duration: number }) {
    this.info('export', `Export completed: ${type}`, {
      ...result,
      operation: 'export_complete'
    });
  }

  // API call logging
  logApiCall(method: string, url: string, duration: number, status: number, data?: any) {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    
    this.log(level, 'api', `API ${method} ${url}`, {
      method,
      url,
      duration,
      status,
      data
    });
  }

  // User interaction logging
  logUserAction(action: string, component: string, data?: any) {
    this.info('ui', `User action: ${action}`, {
      action,
      component,
      data
    });
  }

  // Security logging
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', data?: any) {
    const level = severity === 'critical' ? 'critical' : severity === 'high' ? 'error' : 'warn';
    
    this.log(level, 'security', `Security event: ${event}`, {
      event,
      severity,
      data
    });
  }

  // Get logs for analysis
  getLogs(filters?: {
    level?: LogLevel[];
    category?: LogCategory[];
    startTime?: Date;
    endTime?: Date;
    userId?: string;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.level && filters.level.length > 0) {
        filteredLogs = filteredLogs.filter(log => filters.level!.includes(log.level));
      }
      
      if (filters.category && filters.category.length > 0) {
        filteredLogs = filteredLogs.filter(log => filters.category!.includes(log.category));
      }
      
      if (filters.startTime) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= filters.startTime!);
      }
      
      if (filters.endTime) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= filters.endTime!);
      }
      
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
    }

    return filteredLogs;
  }

  // Get performance metrics
  getPerformanceMetrics(): { name: string; averageDuration: number; callCount: number }[] {
    const metrics = new Map<string, { totalDuration: number; callCount: number }>();
    
    this.logs
      .filter(log => log.category === 'performance' && log.data?.duration)
      .forEach(log => {
        const name = log.data.timerId.split('_')[0];
        const existing = metrics.get(name) || { totalDuration: 0, callCount: 0 };
        existing.totalDuration += log.data.duration;
        existing.callCount += 1;
        metrics.set(name, existing);
      });

    return Array.from(metrics.entries()).map(([name, data]) => ({
      name,
      averageDuration: data.totalDuration / data.callCount,
      callCount: data.callCount
    }));
  }

  // Export logs for analysis
  async exportLogs(format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const logs = this.getLogs();
    
    if (format === 'json') {
      const exportData = {
        metadata: {
          exportedAt: new Date().toISOString(),
          totalLogs: logs.length,
          sessionId: this.sessionId,
          version: '1.0'
        },
        logs
      };
      
      return new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json;charset=utf-8;' 
      });
    } else {
      // CSV format
      const headers = ['timestamp', 'level', 'category', 'message', 'userId', 'url', 'data'];
      let csv = headers.join(',') + '\n';
      
      logs.forEach(log => {
        const row = [
          log.timestamp,
          log.level,
          log.category,
          `"${log.message.replace(/"/g, '""')}"`,
          log.userId || '',
          log.url || '',
          `"${JSON.stringify(log.data || {}).replace(/"/g, '""')}"`
        ];
        csv += row.join(',') + '\n';
      });
      
      return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    }
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    this.logBuffer = [];
    localStorage.removeItem('granite_dev_logs');
    this.info('ui', 'Logs cleared');
  }

  // Private methods
  private outputToConsole(entry: LogEntry) {
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[34m',  // Blue
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      critical: '\x1b[35m' // Magenta
    };
    
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      critical: '🚨'
    };

    const reset = '\x1b[0m';
    const color = colors[entry.level];
    
    const message = `${emoji[entry.level]} ${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} - [${entry.category}] ${entry.message}`;
    
    if (entry.level === 'error' || entry.level === 'critical') {
      console.error(message, entry.data || '');
    } else if (entry.level === 'warn') {
      console.warn(message, entry.data || '');
    } else {
      console.log(message, entry.data || '');
    }
  }

  private persistLog(entry: LogEntry) {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('granite_dev_logs') || '[]');
      existingLogs.push(entry);
      
      // Keep only last 1000 logs in localStorage
      if (existingLogs.length > 1000) {
        existingLogs.splice(0, existingLogs.length - 1000);
      }
      
      localStorage.setItem('granite_dev_logs', JSON.stringify(existingLogs));
    } catch (error) {
      console.error('Failed to persist log:', error);
    }
  }

  private async flushLogs() {
    if (this.logBuffer.length === 0) return;
    
    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];
    
    // In production, send to monitoring service
    if (this.isProduction) {
      try {
        await this.sendToServer(logsToSend);
      } catch (error) {
        console.error('Failed to send logs to server:', error);
        // Add logs back to buffer for retry
        this.logBuffer.unshift(...logsToSend);
      }
    }
  }

  private async sendToServer(logs: LogEntry[]) {
    if (!this.isProduction) return;
    
    // Replace with actual logging endpoint
    const endpoint = '/api/logs';
    
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          logs
        })
      });
    } catch (error) {
      throw new Error(`Failed to send logs: ${error}`);
    }
  }

  private startPeriodicFlush() {
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  private initializeGlobalErrorHandling() {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.critical('ui', 'Unhandled error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.critical('ui', 'Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string | undefined {
    // Replace with actual user ID retrieval logic
    try {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user).id : undefined;
    } catch {
      return undefined;
    }
  }

  private trackBusinessMetric(operation: string, result: string, duration?: number) {
    // Track business metrics for analytics
    const metric = {
      operation,
      result,
      duration,
      timestamp: new Date().toISOString()
    };
    
    try {
      const existingMetrics = JSON.parse(localStorage.getItem('granite_business_metrics') || '[]');
      existingMetrics.push(metric);
      
      // Keep only last 500 metrics
      if (existingMetrics.length > 500) {
        existingMetrics.splice(0, existingMetrics.length - 500);
      }
      
      localStorage.setItem('granite_business_metrics', JSON.stringify(existingMetrics));
    } catch (error) {
      console.error('Failed to track business metric:', error);
    }
  }
}

// Global logger instance
export const devLogger = new DevelopmentLogger();

// Export convenience functions
export const logImportStart = devLogger.logImportStart.bind(devLogger);
export const logImportProgress = devLogger.logImportProgress.bind(devLogger);
export const logImportComplete = devLogger.logImportComplete.bind(devLogger);
export const logExportStart = devLogger.logExportStart.bind(devLogger);
export const logExportComplete = devLogger.logExportComplete.bind(devLogger);
export const logBusinessOperation = devLogger.logBusinessOperation.bind(devLogger);
export const logUserAction = devLogger.logUserAction.bind(devLogger);
export const logApiCall = devLogger.logApiCall.bind(devLogger);
export const logSecurityEvent = devLogger.logSecurityEvent.bind(devLogger);
export const startPerformanceTimer = devLogger.startPerformanceTimer.bind(devLogger);
export const endPerformanceTimer = devLogger.endPerformanceTimer.bind(devLogger);

// Development utilities
export const DevUtils = {
  getLogs: devLogger.getLogs.bind(devLogger),
  getPerformanceMetrics: devLogger.getPerformanceMetrics.bind(devLogger),
  exportLogs: devLogger.exportLogs.bind(devLogger),
  clearLogs: devLogger.clearLogs.bind(devLogger)
};
