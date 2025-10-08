import { useState, useEffect } from 'react';
import { useConfigStore } from '@/stores/configStore';

/**
 * Hook to access business settings with real-time updates
 */
export const useBusinessSettings = () => {
  const { settings } = useConfigStore();
  const [companyName, setCompanyName] = useState<string>('RRStones');

  useEffect(() => {
    // Get initial company name from settings
    const initialCompanyName = settings['business.company_name'] || 'RRStones';
    setCompanyName(initialCompanyName);

    // Listen for company name changes
    const handleCompanyNameChange = (event: CustomEvent<{ companyName: string }>) => {
      setCompanyName(event.detail.companyName);
    };

    window.addEventListener('companyNameChanged', handleCompanyNameChange as EventListener);

    return () => {
      window.removeEventListener('companyNameChanged', handleCompanyNameChange as EventListener);
    };
  }, [settings]);

  return {
    companyName,
    currency: settings['business.currency'] || 'INR',
    timezone: settings['business.timezone'] || 'UTC',
    contactEmail: settings['business.contact_email'] || '',
    contactPhone: settings['business.contact_phone'] || '',
    address: settings['business.address'] || '',
  };
};
