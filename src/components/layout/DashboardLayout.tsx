import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="h-screen flex bg-background">
      <Sidebar />
      
      <div className={cn(
        'flex-1 flex flex-col overflow-hidden transition-all duration-300',
        sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'
      )}>
        <Header />
        
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
