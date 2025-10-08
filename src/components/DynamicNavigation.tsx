import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Package, 
  ShoppingCart, 
  Settings, 
  Shield,
  BarChart3,
  FileText,
  Building,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { usePermissions, PermissionGate } from '@/stores/permissionStore';
import { useNavigation } from '@/stores/configStore';
import type { NavigationItem } from '@/types/dynamic';

// Icon mapping for dynamic icons
const iconMap = {
  home: Home,
  users: Users,
  package: Package,
  'shopping-cart': ShoppingCart,
  settings: Settings,
  shield: Shield,
  'bar-chart': BarChart3,
  'file-text': FileText,
  building: Building,
};

interface DynamicNavigationProps {
  className?: string;
  onItemClick?: (item: NavigationItem) => void;
}

export function DynamicNavigation({ className = '', onItemClick }: DynamicNavigationProps) {
  const location = useLocation();
  const { hasAnyPermission, hasAnyRole, currentUser } = usePermissions();
  const { items } = useNavigation();
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const canAccessItem = (item: NavigationItem): boolean => {
    // Check permissions
    if (item.requiredPermissions.length > 0) {
      if (!hasAnyPermission(item.requiredPermissions)) {
        return false;
      }
    }

    // Check roles
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      if (!hasAnyRole(item.requiredRoles)) {
        return false;
      }
    }

    return true;
  };

  const isItemActive = (item: NavigationItem): boolean => {
    if (item.path === location.pathname) return true;
    
    // Check if any child is active
    if (item.children) {
      return item.children.some(child => 
        child.path === location.pathname || 
        (child.children && isItemActive(child))
      );
    }
    
    return false;
  };

  const renderNavigationItem = (item: NavigationItem, level = 0): React.ReactNode => {
    if (!canAccessItem(item)) return null;

    const IconComponent = iconMap[item.icon as keyof typeof iconMap];
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isActive = isItemActive(item);

    const handleClick = () => {
      if (hasChildren) {
        toggleExpanded(item.id);
      }
      onItemClick?.(item);
    };

    const itemContent = (
      <div
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${
          isActive
            ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        } ${level > 0 ? `ml-${level * 4}` : ''}`}
        onClick={handleClick}
      >
        {IconComponent && (
          <IconComponent 
            className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} 
          />
        )}
        <span className="flex-1">{item.label}</span>
        
        {/* Badge */}
        {item.badge && (
          <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
            item.badge.color === 'red' ? 'bg-red-100 text-red-800' :
            item.badge.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
            item.badge.color === 'green' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {item.badge.text}
          </span>
        )}

        {/* Expand/Collapse Icon */}
        {hasChildren && (
          isExpanded ? 
            <ChevronDown className="ml-2 h-4 w-4 text-gray-400" /> :
            <ChevronRight className="ml-2 h-4 w-4 text-gray-400" />
        )}
      </div>
    );

    return (
      <div key={item.id}>
        {item.path ? (
          <Link to={item.path} className="block">
            {itemContent}
          </Link>
        ) : (
          itemContent
        )}

        {/* Render children */}
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!
              .filter(child => canAccessItem(child))
              .map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Filter and sort visible items
  const visibleItems = items
    .filter((item: NavigationItem) => item.isVisible && canAccessItem(item))
    .sort((a: NavigationItem, b: NavigationItem) => a.order - b.order);

  return (
    <nav className={`space-y-1 ${className}`}>
      {visibleItems.map((item: NavigationItem) => renderNavigationItem(item))}
      
      {/* User Role Badge */}
      {currentUser && (
        <div className="mt-8 pt-4 border-t border-gray-200">
          <div className="px-4 py-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </div>
            <div className="mt-1 flex items-center">
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                currentUser.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                currentUser.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                currentUser.role === 'manager' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {currentUser.role.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// Dynamic menu for top navigation
export function DynamicTopMenu({ className = '' }: { className?: string }) {
  const { hasAnyPermission, hasAnyRole } = usePermissions();
  const { items } = useNavigation();
  const location = useLocation();

  const topLevelItems = items
    .filter((item: NavigationItem) => 
      item.isVisible && 
      (!item.requiredPermissions.length || hasAnyPermission(item.requiredPermissions)) &&
      (!item.requiredRoles?.length || hasAnyRole(item.requiredRoles))
    )
    .sort((a: NavigationItem, b: NavigationItem) => a.order - b.order);

  return (
    <div className={`flex space-x-4 ${className}`}>
      {topLevelItems.map((item: NavigationItem) => {
        const IconComponent = iconMap[item.icon as keyof typeof iconMap];
        const isActive = location.pathname === item.path;

        return (
          <PermissionGate
            key={item.id}
            permissions={item.requiredPermissions}
            roles={item.requiredRoles}
            requireAll={false}
          >
            {item.path ? (
              <Link
                to={item.path}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {IconComponent && (
                  <IconComponent className="mr-2 h-4 w-4" />
                )}
                {item.label}
                {item.badge && (
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    item.badge.color === 'red' ? 'bg-red-100 text-red-800' :
                    item.badge.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    item.badge.color === 'green' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {item.badge.text}
                  </span>
                )}
              </Link>
            ) : (
              <span className="flex items-center px-3 py-2 text-sm font-medium text-gray-600">
                {IconComponent && (
                  <IconComponent className="mr-2 h-4 w-4" />
                )}
                {item.label}
              </span>
            )}
          </PermissionGate>
        );
      })}
    </div>
  );
}
