import { api } from './api';

export interface Tariff {
  id: number;
  name: string;
  description?: string;
  currency: string;
  energyRate?: number; // Price per kWh (backend uses energyRate)
  energyPrice?: number; // Alias for energyRate
  timeRate?: number; // Price per hour (backend uses timeRate)
  timePrice?: number; // Alias for timeRate
  baseFee?: number; // Base fee (backend uses baseFee)
  parkingPrice?: number; // Price per hour for parking (optional)
  isActive?: boolean;
  validFrom?: string;
  validTo?: string;
  vendorId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTariffDto {
  name: string;
  description?: string;
  currency?: string;
  energyRate?: number; // Backend uses energyRate
  energyPrice?: number; // Alias
  timeRate?: number; // Backend uses timeRate
  timePrice?: number; // Alias
  baseFee?: number; // Backend uses baseFee
  parkingPrice?: number;
  validFrom?: string;
  validTo?: string;
  vendorId?: number;
}

export interface UpdateTariffDto {
  name?: string;
  description?: string;
  currency?: string;
  energyPrice?: number;
  timePrice?: number;
  parkingPrice?: number;
  isActive?: boolean;
  validFrom?: string;
  validTo?: string;
}

export const tariffsApi = {
  /**
   * Get all tariffs
   */
  getAll: async (): Promise<Tariff[]> => {
    const response = await api.get('/admin/tariffs');
    return response.data;
  },

  /**
   * Get active tariff
   */
  getActive: async (): Promise<Tariff | null> => {
    const response = await api.get('/admin/tariffs/active');
    return response.data;
  },

  /**
   * Get tariff by ID
   */
  getById: async (id: number): Promise<Tariff> => {
    const response = await api.get(`/admin/tariffs/${id}`);
    return response.data;
  },

  /**
   * Create new tariff
   */
  create: async (data: CreateTariffDto): Promise<Tariff> => {
    const response = await api.post('/admin/tariffs', data);
    return response.data;
  },

  /**
   * Update tariff
   */
  update: async (id: number, data: UpdateTariffDto): Promise<Tariff> => {
    const response = await api.put(`/admin/tariffs/${id}`, data);
    return response.data;
  },

  /**
   * Delete tariff
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/admin/tariffs/${id}`);
  },
};
