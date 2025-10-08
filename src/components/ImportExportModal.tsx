import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import { settingsApi } from '../services/settingsApi';

interface ImportExportModalProps {
  onClose: () => void;
  onImport: (result: { imported: number; errors: any[] }) => void;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({
  onClose,
  onImport
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await settingsApi.exportSettings(exportFormat);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError(null);
    setImportPreview(null);

    // Preview file content
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let preview: any[] = [];

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (typeof parsed === 'object' && !Array.isArray(parsed)) {
            // Grouped format - flatten it
            preview = Object.values(parsed).flat();
          } else {
            preview = parsed;
          }
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n').filter(line => line.trim());
          if (lines.length > 1) {
            preview = lines.slice(1, 6).map((line, index) => {
              const values = line.split(',').map(v => v.replace(/"/g, ''));
              return {
                category: values[0] || `Row ${index + 2}`,
                key: values[1] || 'unknown',
                value: values[2] || '',
                type: values[3] || 'string'
              };
            });
          }
        }

        setImportPreview(preview.slice(0, 5)); // Show first 5 items
      } catch (error) {
        setImportError('Failed to parse file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importFile) return;

    try {
      setIsImporting(true);
      const result = await settingsApi.importSettings(importFile);
      onImport(result);
      onClose();
    } catch (error: any) {
      setImportError(error.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Import / Export Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('export')}
              className={`flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Download className="h-4 w-4 inline mr-2" />
              Export
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Upload className="h-4 w-4 inline mr-2" />
              Import
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'export' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Export Settings</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Download your current settings configuration for backup or sharing.
                </p>
              </div>

              {/* Export Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Export Format
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={(e) => setExportFormat(e.target.value as 'json')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">JSON</div>
                      <div className="text-sm text-gray-500">
                        Machine-readable format, preserves data types
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={(e) => setExportFormat(e.target.value as 'csv')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">CSV</div>
                      <div className="text-sm text-gray-500">
                        Spreadsheet-compatible format
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Export Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Export includes:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-600">
                      <li>All public and private settings</li>
                      <li>Categories and metadata</li>
                      <li>Validation rules</li>
                      <li>Current values</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Settings ({exportFormat.toUpperCase()})
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Import Settings</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a settings file to restore or merge configuration.
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <div className="border-2 border-gray-300 border-dashed rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {importFile ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                      <p className="text-sm font-medium text-gray-900">
                        {importFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(importFile.size / 1024).toFixed(1)} KB
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Choose different file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FileText className="h-8 w-8 text-gray-400 mx-auto" />
                      <div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          Click to upload
                        </button>
                        <p className="text-xs text-gray-500">
                          or drag and drop
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        JSON or CSV files only
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Import Error */}
              {importError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
                    <div className="text-sm text-red-700">
                      <p className="font-medium">Import Error</p>
                      <p>{importError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* File Preview */}
              {importPreview && importPreview.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview (first 5 items)
                  </label>
                  <div className="bg-gray-50 border rounded-md p-4 max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                      {importPreview.map((item, index) => (
                        <div key={index} className="text-xs font-mono bg-white p-2 rounded border">
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <span className="font-semibold text-gray-600">Category:</span>
                              <br />
                              {item.category}
                            </div>
                            <div>
                              <span className="font-semibold text-gray-600">Key:</span>
                              <br />
                              {item.key}
                            </div>
                            <div>
                              <span className="font-semibold text-gray-600">Type:</span>
                              <br />
                              {item.type}
                            </div>
                            <div>
                              <span className="font-semibold text-gray-600">Value:</span>
                              <br />
                              <span className="truncate">
                                {typeof item.value === 'string' 
                                  ? item.value.substring(0, 20) + (item.value.length > 20 ? '...' : '')
                                  : JSON.stringify(item.value).substring(0, 20) + '...'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Import Warning */}
              {importFile && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
                    <div className="text-sm text-yellow-700">
                      <p className="font-medium mb-1">Import Behavior:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Settings with existing keys will be skipped</li>
                        <li>Only new settings will be created</li>
                        <li>Invalid settings will be reported as errors</li>
                        <li>This operation cannot be undone</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Import Button */}
              <button
                onClick={handleImport}
                disabled={!importFile || isImporting || !!importError}
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Settings
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal;
