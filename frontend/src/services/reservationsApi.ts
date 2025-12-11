import { api } from './api';

export interface Reservation {
  id: number;
  reservationId: number;
  chargePointId: string;
  connectorId: number;
  idTag: string;
  expiryDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const reservationsApi = {
  /**
   * Create a reservation
   */
  create: async (data: {
    chargePointId: string;
    reservationId: number;
    connectorId: number;
    idTag: string;
    parentIdTag?: string;
    expiryDate: string;
  }): Promise<{ status: string }> => {
    const response = await api.post('/reservations', data);
    return response.data;
  },

  /**
   * Cancel a reservation
   */
  cancel: async (reservationId: number, chargePointId: string): Promise<{ status: string }> => {
    const response = await api.post(`/reservations/${reservationId}/cancel`, { chargePointId });
    return response.data;
  },

  /**
   * Get reservation by ID
   */
  getById: async (reservationId: number): Promise<Reservation> => {
    const response = await api.get(`/reservations/${reservationId}`);
    return response.data;
  },

  /**
   * Get reservations for charge point
   */
  getByChargePoint: async (chargePointId: string): Promise<Reservation[]> => {
    const response = await api.get(`/reservations/charge-point/${chargePointId}`);
    return response.data;
  },

  /**
   * Get active reservations
   */
  getActive: async (chargePointId?: string): Promise<Reservation[]> => {
    const params = chargePointId ? `?chargePointId=${chargePointId}` : '';
    const response = await api.get(`/reservations/active${params}`);
    return response.data;
  },
};



