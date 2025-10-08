import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings as SettingsIcon, 
  Save, 
  Building,
  Bell,
  Shield,
  Palette,
  DollarSign,
  ChevronRight,
  X,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { settingsApi } from '@/services/settingsApi';
import { triggerAutoRefresh, getRefreshSuccessMessage } from '@/utils/autoRefresh';
import { useAuthStore } from '@/store/authStore';

// Settings sections with user-friendly names and descriptions
const settingsSections = [
  {
    id: 'profile',
    title: 'Company Profile',
    icon: Building,
    description: 'Manage your company information',
    color: 'bg-primary'
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Palette,
    description: 'Customize the look and feel',
    color: 'bg-purple-500'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Control how you receive alerts',
    color: 'bg-success'
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    icon: Shield,
    description: 'Manage security settings',
    color: 'bg-error'
  },
  {
    id: 'business',
    title: 'Business Settings',
    icon: DollarSign,
    description: 'Configure business operations',
    color: 'bg-warning'
  },
  {
    id: 'system',
    title: 'System',
    icon: SettingsIcon,
    description: 'Advanced system settings',
    color: 'bg-muted-foreground'
  }
];

const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.permissions?.includes('settings:read');

  const [activeSection, setActiveSection] = useState('profile');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Query settings
  const { 
    data: settings = {}, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getAllSettings(isAdmin),
    enabled: isAdmin
  });

  // Initialize defaults mutation
  const initializeDefaultsMutation = useMutation({
    mutationFn: () => settingsApi.initializeDefaults(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(`Initialized ${data.initialized.length} default settings`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to initialize defaults');
    }
  });

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) => 
      settingsApi.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(getRefreshSuccessMessage());
      setHasUnsavedChanges(false);
      
      // Trigger automatic hard refresh
      triggerAutoRefresh({
        delay: 1500,
        showCountdown: true
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    }
  });

  const handleValueChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    Object.entries(formData).forEach(([key, value]) => {
      updateSettingMutation.mutate({ key, value });
    });
    setFormData({});
  };

  const getValue = (key: string) => {
    if (formData[key] !== undefined) return formData[key];
    
    // Find setting in nested settings object
    for (const category of Object.values(settings)) {
      if (Array.isArray(category)) {
        const setting = category.find((s: any) => s.key === key);
        if (setting) return setting.value;
      }
    }
    return '';
  };

  const renderToggle = (label: string, description: string, settingKey: string) => (
    <div className="flex items-center justify-between py-4 border-b border-border">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-foreground">{label}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => handleValueChange(settingKey, !getValue(settingKey))}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          getValue(settingKey) ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
            getValue(settingKey) ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const renderInput = (label: string, description: string, settingKey: string, type = 'text', options?: string[]) => (
    <div className="py-4 border-b border-border">
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      {options ? (
        <select
          value={getValue(settingKey)}
          onChange={(e) => handleValueChange(settingKey, e.target.value)}
          className="block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:ring-primary/20 focus:border-primary bg-background text-foreground"
        >
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={getValue(settingKey)}
          onChange={(e) => handleValueChange(settingKey, type === 'number' ? Number(e.target.value) : e.target.value)}
          className="block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:ring-primary/20 focus:border-primary bg-background text-foreground"
        />
      )}
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-0">
            <h2 className="text-xl font-semibold text-foreground mb-6">Company Profile</h2>
            {renderInput('Company Name', 'The name of your company', 'business.company_name')}
            {renderInput('Application Name', 'Name displayed in the application', 'app.name')}
            {renderInput('Application Version', 'Current version of the application', 'app.version')}
            {renderToggle('Maintenance Mode', 'Enable this to show maintenance message to users', 'app.maintenance_mode')}
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-0">
            <h2 className="text-xl font-semibold text-foreground mb-6">Appearance</h2>
            {renderInput('Theme', 'Choose your preferred theme', 'appearance.theme', 'text', ['light', 'dark', 'auto'])}
            {renderInput('Primary Color', 'Main color for the interface', 'appearance.primary_color', 'color')}
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-0">
            <h2 className="text-xl font-semibold text-foreground mb-6">Notifications</h2>
            {renderToggle('Email Notifications', 'Receive notifications via email', 'notifications.email_enabled')}
            {renderToggle('SMS Notifications', 'Receive notifications via SMS', 'notifications.sms_enabled')}
          </div>
        );

      case 'security':
        return (
          <div className="space-y-0">
            <h2 className="text-xl font-semibold text-foreground mb-6">Security & Privacy</h2>
            {renderInput('Session Timeout', 'How long users stay logged in (seconds)', 'security.session_timeout', 'number')}
            {renderInput('Minimum Password Length', 'Required minimum characters for passwords', 'security.password_min_length', 'number')}
          </div>
        );

      case 'business':
        return (
          <div className="space-y-0">
            <h2 className="text-xl font-semibold text-foreground mb-6">Business Settings</h2>
            {renderInput('Default Currency', 'Currency used throughout the application', 'business.currency', 'text', ['INR', 'USD', 'EUR', 'GBP'])}
            {renderInput('Tax Rate (%)', 'Default tax rate applied to transactions', 'business.tax_rate', 'number')}
          </div>
        );

      case 'system':
        return (
          <div className="space-y-0">
            <h2 className="text-xl font-semibold text-foreground mb-6">System Settings</h2>
            <div className="bg-warning-lighter border border-warning-light rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <RefreshCw className="h-5 w-5 text-warning-foreground" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-warning-foreground">Initialize Default Settings</h3>
                  <p className="text-sm text-warning-foreground/80 mt-1">
                    This will create default settings if they don't exist. Existing settings won't be changed.
                  </p>
                  <button
                    onClick={() => initializeDefaultsMutation.mutate()}
                    disabled={initializeDefaultsMutation.isPending}
                    className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-warning-foreground bg-warning-light hover:bg-warning disabled:opacity-50"
                  >
                    {initializeDefaultsMutation.isPending ? (
                      <>
                        <RefreshCw className="animate-spin -ml-1 mr-2 h-3 w-3" />
                        Initializing...
                      </>
                    ) : (
                      'Initialize Defaults'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access settings.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <X className="h-12 w-12 text-error mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Error Loading Settings</h1>
          <p className="text-muted-foreground">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your application preferences and configuration</p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-4 py-3 text-left hover:bg-muted/50 border-b border-border last:border-b-0 ${
                      activeSection === section.id ? 'bg-primary-lighter border-r-2 border-r-primary' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${section.color} bg-opacity-10 mr-3`}>
                      <Icon className={`h-4 w-4 ${section.color.replace('bg-', 'text-')}`} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{section.title}</div>
                      <div className="text-xs text-muted-foreground">{section.description}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-card rounded-lg shadow-sm border border-border">
              <div className="p-6">
                {renderSection()}
              </div>

              {/* Save Button */}
              {hasUnsavedChanges && (
                <div className="border-t border-border px-6 py-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      You have unsaved changes
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setFormData({});
                          setHasUnsavedChanges(false);
                        }}
                        className="inline-flex items-center px-3 py-2 border border-input shadow-sm text-sm leading-4 font-medium rounded-md text-foreground bg-background hover:bg-muted/50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={updateSettingMutation.isPending}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50"
                      >
                        {updateSettingMutation.isPending ? (
                          <>
                            <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="-ml-1 mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
