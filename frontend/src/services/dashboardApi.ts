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
    averageSessionDuration?: number;
    averageRevenuePerSession?: number;
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
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  /**
   * Get vendor dashboard statistics (for Admin users)
   * Note: Backend automatically returns vendor-scoped stats for Admin users
   */
  getVendorStats: async (): Promise<DashboardStats> => {
    // Use the same endpoint - backend handles vendor scoping automatically
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};

