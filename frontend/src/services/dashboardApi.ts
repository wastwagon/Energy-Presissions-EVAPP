import { api } from './api';

export interface DashboardStats {
  overview: {
    totalUsers?: number;
    totalChargePoints?: number;
    totalVendors?: number;
    activeSessions: number;
    totalTransactions: number;
    totalSessions?: number;
    totalInvoices?: number;
    totalPayments?: number;
    totalRevenue?: number;
    totalPaymentsAmount?: number;
    /** Sum of pending wallet session holds network-wide */
    pendingWalletReserved?: number;
    activeBillingSessions?: number;
    averageSessionDuration?: number | null;
    averageRevenuePerSession?: number | null;
    billedSessionCount?: number;
  };
  totalUsers?: number;
  totalRevenue?: number;
  totalSessions?: number;
  totalVendors?: number;
  activeSessions?: number;
  averageSessionDuration?: number;
  averageRevenuePerSession?: number;
  connectionHealth?: {
    totalDevices: number;
    devicesWithErrors: number;
    averageSuccessRate: number;
    totalAttempts: number;
    totalSuccesses: number;
  };
  breakdowns: {
    usersByType?: Array<{ type: string; count: number }>;
    chargePointsByStatus: Array<{ status: string; count: number }>;
  };
}

export const dashboardApi = {
  /**
   * Get dashboard statistics (auto-detects SuperAdmin vs Admin)
   */
  getStats: async (opts?: { signal?: AbortSignal }): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats', { signal: opts?.signal });
    return response.data;
  },

  /**
   * Get vendor dashboard statistics (for Admin users)
   * Note: Backend automatically returns vendor-scoped stats for Admin users
   */
  getVendorStats: async (opts?: { signal?: AbortSignal }): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats', { signal: opts?.signal });
    return response.data;
  },
};

export type SessionReportRow = import('./transactionsApi').Transaction;

export const reportsApi = {
  getSessionRows: async (
    limit = 100,
    offset = 0,
    vendorId?: number,
  ): Promise<{ transactions: SessionReportRow[]; total: number }> => {
    const params = new URLSearchParams();
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    if (vendorId) params.append('vendorId', String(vendorId));
    const response = await api.get(`/transactions?${params.toString()}`);
    return response.data;
  },
};

