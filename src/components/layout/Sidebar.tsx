import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Settings,
  Mountain,
  UserCog,
  Shield,
  LogOut,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['customer', 'staff', 'admin', 'super_admin'] },
  { name: 'Users', href: '/users', icon: Users, roles: ['admin', 'super_admin'] },
  { name: 'Granite Products', href: '/granite', icon: Mountain, roles: ['staff', 'admin', 'super_admin'] },
  { name: 'Orders', href: '/orders', icon: ShoppingCart, roles: ['staff', 'admin', 'super_admin'] },
//   { name: 'Invoices', href: '/invoices', icon: FileText, roles: ['staff', 'admin', 'super_admin'] },
//   { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['admin', 'super_admin'] },
  { name: 'Tiers', href: '/tiers', icon: Package, roles: ['admin', 'super_admin'] },
//   { name: 'Activity Logs', href: '/logs', icon: Activity, roles: ['admin', 'super_admin'] },
  { name: 'Permission Management', href: '/admin', icon: UserCog, roles: ['admin', 'super_admin'] },
  { name: 'Security', href: '/security', icon: Shield, roles: ['admin', 'super_admin'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin', 'super_admin'] },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 transform bg-card border-r transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <div className="flex items-center space-x-2">
              <Mountain className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">RRStones</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={toggleSidebar}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-6">
            {navigation
              .filter(item => item.roles.includes(user?.role || 'customer'))
              .map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 1024) {
                      toggleSidebar();
                    }
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
