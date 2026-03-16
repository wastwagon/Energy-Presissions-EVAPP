import { api } from './api';

export interface AuditLog {
  id: number;
  userId?: number;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: { email: string; firstName?: string; lastName?: string };
}

export const auditApi = {
  getLogs: async (limit = 100, offset = 0): Promise<{ logs: AuditLog[]; total: number }> => {
    const response = await api.get(`/audit/logs?limit=${limit}&offset=${offset}`);
    return response.data;
  },
};
