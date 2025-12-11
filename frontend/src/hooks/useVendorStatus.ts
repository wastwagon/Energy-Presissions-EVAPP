import { useState, useEffect } from 'react';
import { vendorApi, VendorStatus } from '../services/vendorApi';

interface UseVendorStatusReturn {
  status: VendorStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to get and monitor vendor status
 * Used by non-admin users to check their vendor's status
 */
export function useVendorStatus(): UseVendorStatusReturn {
  const [status, setStatus] = useState<VendorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vendorApi.getCurrentVendorStatus();
      setStatus(data.status);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch vendor status');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return {
    status,
    loading,
    error,
    refresh: fetchStatus,
  };
}

