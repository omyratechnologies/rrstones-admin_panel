import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { useGlobalSettingsWatcher } from '@/hooks/useGlobalSettingsWatcher';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import UsersManagement from '@/pages/users/UsersManagement';
import GraniteManagement from '@/pages/granite/GraniteManagement';
import { OrderManagement } from '@/pages/orders/OrderManagement';
// import { Analytics } from '@/pages/Analytics';
import PermissionManagement from '@/pages/admin/PermissionManagement';
import TierManagement from '@/pages/admin/TierManagement';
import { SecurityPage } from '@/pages/Security';
import Settings from '@/pages/Settings';
// import SettingsTest from '@/pages/SettingsTest';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <DashboardLayout>{children}</DashboardLayout>;
}

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Block customers from accessing admin routes
  if (user?.role === 'customer') {
    return <Navigate to="/" replace />;
  }
  
  return <DashboardLayout>{children}</DashboardLayout>;
}

// Component to initialize global settings watcher
function AppInitializer() {
  const { isAuthenticated } = useAuthStore();
  
  // Only initialize settings watcher when user is authenticated
  if (isAuthenticated) {
    useGlobalSettingsWatcher();
  }
  
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInitializer />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <AdminProtectedRoute>
                <UsersManagement />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/granite"
            element={
              <AdminProtectedRoute>
                <GraniteManagement />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <AdminProtectedRoute>
                <OrderManagement />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <AdminProtectedRoute>
                <div>Invoices Management Page (Coming Soon)</div>
              </AdminProtectedRoute>
            }
          />
          {/* <Route
            path="/analytics"
            element={
              <AdminProtectedRoute>
                <Analytics />
              </AdminProtectedRoute>
            }
          /> */}
          <Route
            path="/tiers"
            element={
              <AdminProtectedRoute>
                <TierManagement />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <AdminProtectedRoute>
                <div>Activity Logs Page (Coming Soon)</div>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <PermissionManagement />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/security"
            element={
              <AdminProtectedRoute>
                <SecurityPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <AdminProtectedRoute>
                <Settings />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/settings-test"
            element={
              <AdminProtectedRoute>
                <Settings />
              </AdminProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            fontSize: '14px',
          },
          success: {
            style: {
              border: '1px solid #10B981',
            },
          },
          error: {
            style: {
              border: '1px solid #EF4444',
            },
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
