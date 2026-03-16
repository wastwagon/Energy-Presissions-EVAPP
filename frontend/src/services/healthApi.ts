import { api } from './api';

export interface HealthStatus {
  status: string;
  timestamp: string;
}

export const healthApi = {
  getHealth: async (): Promise<HealthStatus> => {
    const response = await api.get('/health');
    return response.data;
  },
};
