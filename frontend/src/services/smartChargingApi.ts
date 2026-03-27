import { api } from './api';

export const smartChargingApi = {
  getCompositeSchedule: async (params: {
    chargePointId: string;
    connectorId: number;
    duration: number;
    chargingRateUnit?: 'A' | 'W';
  }): Promise<unknown> => {
    const response = await api.get('/smart-charging/composite-schedule', { params });
    return response.data;
  },

  getProfiles: async (chargePointId: string, connectorId?: number): Promise<unknown> => {
    const response = await api.get(`/smart-charging/profiles/${encodeURIComponent(chargePointId)}`, {
      params: connectorId != null ? { connectorId } : undefined,
    });
    return response.data;
  },

  getProfile: async (id: number): Promise<unknown> => {
    const response = await api.get(`/smart-charging/profile/${id}`);
    return response.data;
  },
};
