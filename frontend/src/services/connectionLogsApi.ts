import { api } from './api';

export type ConnectionEventType =
  | 'connection_attempt'
  | 'connection_success'
  | 'connection_failed'
  | 'connection_closed'
  | 'error'
  | 'message_error';

export type ConnectionStatus = 'success' | 'failed' | 'rejected' | 'timeout' | 'error';

export interface ConnectionLog {
  id: number;
  chargePointId: string;
  eventType: ConnectionEventType;
  status?: ConnectionStatus;
  errorCode?: string;
  errorMessage?: string;
  closeCode?: number;
  closeReason?: string;
  ipAddress?: string;
  userAgent?: string;
  requestUrl?: string;
  vendorId?: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ConnectionStatistics {
  chargePointId: string;
  totalAttempts: number;
  successfulConnections: number;
  failedConnections: number;
  lastConnectionAttempt?: string;
  lastSuccessfulConnection?: string;
  lastFailedConnection?: string;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  consecutiveFailures: number;
  updatedAt: string;
}

export const connectionLogsApi = {
  /**
   * Get connection logs
   */
  getLogs: async (
    chargePointId?: string,
    eventType?: ConnectionEventType,
    limit: number = 100,
    offset: number = 0,
    startDate?: string,
    endDate?: string,
  ): Promise<{ logs: ConnectionLog[]; total: number }> => {
    const params = new URLSearchParams();
    if (chargePointId) params.append('chargePointId', chargePointId);
    if (eventType) params.append('eventType', eventType);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get(`/connection-logs?${params.toString()}`);
    return response.data;
  },

  /**
   * Search connection logs
   */
  searchLogs: async (
    searchTerm: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ logs: ConnectionLog[]; total: number }> => {
    const params = new URLSearchParams();
    params.append('q', searchTerm);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await api.get(`/connection-logs/search?${params.toString()}`);
    return response.data;
  },

  /**
   * Get connection statistics for a charge point
   */
  getStatistics: async (chargePointId: string): Promise<ConnectionStatistics | null> => {
    const response = await api.get(`/connection-logs/statistics/${chargePointId}`);
    return response.data;
  },

  /**
   * Get all connection statistics
   */
  getAllStatistics: async (): Promise<ConnectionStatistics[]> => {
    const response = await api.get('/connection-logs/statistics');
    return response.data;
  },

  /**
   * Get recent connection errors
   */
  getRecentErrors: async (limit: number = 50): Promise<ConnectionLog[]> => {
    const response = await api.get(`/connection-logs/errors/recent?limit=${limit}`);
    return response.data;
  },

  /**
   * Get connection health summary
   */
  getHealthSummary: async (): Promise<{
    totalDevices: number;
    devicesWithErrors: number;
    recentFailures: number;
    averageSuccessRate: number;
  }> => {
    const response = await api.get('/connection-logs/health');
    return response.data;
  },

  /**
   * Delete resolved connection errors
   */
  deleteResolvedErrors: async (olderThanHours?: number, errorCode?: string): Promise<{ deleted: number }> => {
    const params = new URLSearchParams();
    if (olderThanHours) params.append('olderThanHours', olderThanHours.toString());
    if (errorCode) params.append('errorCode', errorCode);
    const response = await api.delete(`/connection-logs/errors/resolved?${params.toString()}`);
    return response.data;
  },

  /**
   * Delete a specific error log by ID
   */
  deleteError: async (id: number): Promise<void> => {
    await api.delete(`/connection-logs/errors/${id}`);
  },
};



