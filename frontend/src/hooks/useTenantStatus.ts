import { useState, useEffect } from 'react';
import { tenantApi, TenantStatus } from '../services/tenantApi';

interface TenantStatusState {
  status: TenantStatus | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to check tenant status on app boot
 * This should be used in the main App component to check tenant status
 * and redirect to appropriate pages if tenant is suspended/disabled
 */
export function useTenantStatus() {
  const [state, setState] = useState<TenantStatusState>({
    status: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    checkTenantStatus();
  }, []);

  const checkTenantStatus = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      // For now, skip tenant status check if endpoint doesn't exist
      // This allows the app to work without tenant management initially
      const statusInfo = await tenantApi.getCurrentStatus();
      setState({
        status: statusInfo.status,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      // If endpoint doesn't exist (404) or other error, assume active (backward compatibility)
      // This prevents the app from breaking if tenant management isn't fully set up
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
    refresh: checkTenantStatus,
  };
}

