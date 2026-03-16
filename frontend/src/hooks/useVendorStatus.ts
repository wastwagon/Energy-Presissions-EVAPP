import { useState, useEffect } from 'react';
import { vendorApi, VendorStatus } from '../services/vendorApi';

interface VendorStatusState {
  status: VendorStatus | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to check vendor status on app boot
 * This should be used in the main App component to check vendor status
 * and redirect to appropriate pages if vendor is suspended/disabled
 */
export function useVendorStatus() {
  const [state, setState] = useState<VendorStatusState>({
    status: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    checkVendorStatus();
  }, []);

  const checkVendorStatus = async () => {
    // Skip if not logged in - avoids CORS preflight and 401 on login page
    if (!localStorage.getItem('token')) {
      setState({ status: 'active', loading: false, error: null });
      return;
    }
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const statusInfo = await vendorApi.getCurrentVendorStatus();
      setState({
        status: statusInfo.status,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      // If endpoint doesn't exist (404) or other error, assume active (backward compatibility)
      // This prevents the app from breaking if vendor management isn't fully set up
      if (error.response?.status === 404) {
        // Endpoint doesn't exist yet, default to active
        setState({
          status: 'active',
          loading: false,
          error: null,
        });
      } else {
        setState({
          status: 'active',
          loading: false,
          error: null, // Don't show error to user, just default to active
        });
      }
    }
  };

  return {
    ...state,
    isActive: state.status === 'active',
    isSuspended: state.status === 'suspended',
    isDisabled: state.status === 'disabled',
    refresh: checkVendorStatus,
  };
}

