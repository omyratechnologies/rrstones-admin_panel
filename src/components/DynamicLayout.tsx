import React from 'react';
import { Outlet } from 'react-router-dom';
import { PermissionGate } from '@/stores/permissionStore';
import { DynamicNavigation } from '@/components/DynamicNavigation';
import { useTheme, useFeatures } from '@/stores/configStore';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

interface DynamicLayoutProps {
  children?: React.ReactNode;
}

export function DynamicLayout({ children }: DynamicLayoutProps) {
  const { current: theme } = useTheme();
  const { isEnabled } = useFeatures();
  const { companyName } = useBusinessSettings();
  
  // Apply theme CSS variables
  React.useEffect(() => {
    if (theme) {
      const root = document.documentElement;
      Object.entries(theme.variables || {}).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, String(value));
      });
    }
  }, [theme]);

  const showSidebar = isEnabled('sidebar_navigation');
  const showTopNav = isEnabled('top_navigation');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dynamic Top Navigation */}
      {showTopNav && (
        <PermissionGate permissions={['navigation:view']}>
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {companyName} Admin
                  </h1>
                </div>
                {/* Top menu items would go here */}
              </div>
            </div>
          </header>
        </PermissionGate>
      )}

      <div className="flex">
        {/* Dynamic Sidebar */}
        {showSidebar && (
          <PermissionGate permissions={['navigation:view']}>
            <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
              <div className="p-4">
                <DynamicNavigation />
              </div>
            </aside>
          </PermissionGate>
        )}

        {/* Main Content */}
        <main className="flex-1">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

// Dynamic page wrapper with feature flag support
interface DynamicPageProps {
  requiredPermissions?: string[];
  requiredRoles?: string[];
  featureFlag?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function DynamicPage({
  requiredPermissions = [],
  requiredRoles = [],
  featureFlag,
  fallback,
  children
}: DynamicPageProps) {
  const { isEnabled } = useFeatures();

  // Check feature flag first
  if (featureFlag && !isEnabled(featureFlag)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Feature Not Available</h1>
          <p className="text-gray-500">This feature is currently disabled.</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permissions={requiredPermissions}
      roles={requiredRoles}
      fallback={fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-500">You don't have permission to access this page.</p>
          </div>
        </div>
      )}
    >
      {children}
    </PermissionGate>
  );
}
