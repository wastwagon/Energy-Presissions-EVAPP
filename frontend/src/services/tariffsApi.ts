import { api } from './api';

export interface Tariff {
  id: number;
  name: string;
  description?: string;
  energyRate?: number;
  timeRate?: number;
  baseFee?: number;
  currency: string;
  isActive: boolean;
  validFrom?: string;
  validTo?: string;
  createdAt: string;
  updatedAt: string;
}

export const tariffsApi = {
  getAll: async (): Promise<Tariff[]> => {
    const response = await api.get('/admin/tariffs');
    return response.data;
  },

  getActive: async (currency?: string): Promise<Tariff | null> => {
    const params = currency ? `?currency=${currency}` : '';
    const response = await api.get(`/admin/tariffs/active${params}`);
    return response.data;
  },

  getById: async (id: number): Promise<Tariff> => {
    const response = await api.get(`/admin/tariffs/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    description?: string;
    energyRate?: number;
    timeRate?: number;
    baseFee?: number;
    currency?: string;
    validFrom?: Date;
    validTo?: Date;
  }): Promise<Tariff> => {
    const response = await api.post('/admin/tariffs', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Tariff>): Promise<Tariff> => {
    const response = await api.put(`/admin/tariffs/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/admin/tariffs/${id}`);
  },
};

