import { api } from './api';

export interface PaymentMethod {
  id: number;
  userId: number;
  type: string;
  provider?: string;
  lastFour?: string;
  phone?: string;
  isDefault: boolean;
  createdAt: string;
}

export const paymentMethodsApi = {
  getByUser: async (userId: number): Promise<PaymentMethod[]> => {
    const response = await api.get(`/payment-methods/user/${userId}`);
    return response.data;
  },

  create: async (
    userId: number,
    data: { type: string; provider?: string; lastFour?: string; phone?: string; isDefault?: boolean },
  ): Promise<PaymentMethod> => {
    const response = await api.post(`/payment-methods/user/${userId}`, data);
    return response.data;
  },

  setDefault: async (userId: number, id: number): Promise<PaymentMethod> => {
    const response = await api.post(`/payment-methods/user/${userId}/${id}/default`);
    return response.data;
  },

  delete: async (userId: number, id: number): Promise<void> => {
    await api.delete(`/payment-methods/user/${userId}/${id}`);
  },
};
