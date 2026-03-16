import { api } from './api';

export interface Reservation {
  id: number;
  chargePointId: string;
  connectorId: number;
  idTag: string;
  expiryDate: string;
  status?: string;
}

export const reservationsApi = {
  getActive: async (chargePointId?: string): Promise<Reservation[]> => {
    const params = chargePointId ? { chargePointId } : {};
    const response = await api.get('/reservations/active', { params });
    return response.data;
  },

  cancel: async (reservationId: number, chargePointId: string): Promise<void> => {
    await api.post(`/reservations/${reservationId}/cancel`, { chargePointId });
  },
};
