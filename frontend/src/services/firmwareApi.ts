import { api } from './api';

export interface FirmwareJob {
  id: number;
  chargePointId: string;
  location: string;
  retrieveDate: string;
  status: string;
  createdAt?: string;
}

export const firmwareApi = {
  update: async (data: {
    chargePointId: string;
    location: string;
    retrieveDate: string;
    retryInterval?: number;
    retries?: number;
  }) => {
    const response = await api.post('/firmware/update', data);
    return response.data;
  },

  getJobs: async (chargePointId: string): Promise<FirmwareJob[]> => {
    const response = await api.get(`/firmware/jobs/${chargePointId}`);
    return response.data;
  },
};
