import { api } from './api';

export interface DiagnosticsJob {
  id: number;
  chargePointId: string;
  location: string;
  startTime?: string;
  stopTime?: string;
  status: string;
  createdAt?: string;
}

export const diagnosticsApi = {
  get: async (data: {
    chargePointId: string;
    location: string;
    startTime?: string;
    stopTime?: string;
    retryInterval?: number;
    retries?: number;
  }) => {
    const response = await api.post('/diagnostics/get', data);
    return response.data;
  },

  getJobs: async (chargePointId: string): Promise<DiagnosticsJob[]> => {
    const response = await api.get(`/diagnostics/jobs/${chargePointId}`);
    return response.data;
  },
};
