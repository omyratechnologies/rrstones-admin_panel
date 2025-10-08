import React from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

interface AppLoadingProps {
  isLoading: boolean;
  error?: string | null;
  progress?: number;
  currentStep?: string;
  onRetry?: () => void;
}

const AppLoading: React.FC<AppLoadingProps> = ({
  isLoading,
  error,
  progress = 0,
  currentStep = 'Loading...',
  onRetry
}) => {
  const { companyName } = useBusinessSettings();
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Failed to Load Application</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            {onRetry && (
              <Button onClick={onRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading {companyName}</h2>
          <p className="text-gray-600 mb-4">{currentStep}</p>
          
          {progress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          
          <div className="space-y-2 text-xs text-gray-500">
            <div>• Initializing system configuration</div>
            <div>• Loading user permissions</div>
            <div>• Setting up navigation</div>
            <div>• Applying theme preferences</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppLoading;
