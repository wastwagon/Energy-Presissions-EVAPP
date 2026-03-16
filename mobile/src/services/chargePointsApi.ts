/**
 * Charge Points API Service
 */

import { api } from './api';
import { ChargePoint } from '../types';

export interface StartChargingRequest {
  connectorId: number;
  userId: number;
  amount: number;
}

export interface StartChargingResponse {
  transactionId: number;
  chargePointId: string;
  connectorId: number;
  startTime: Date;
  reservedAmount: number;
}

export const chargePointsApi = {
  /**
   * Get all charge points
   */
  getAll: async (): Promise<ChargePoint[]> => {
    const response = await api.get('/charge-points');
    return response.data;
  },

  /**
   * Get charge point by ID
   */
  getById: async (id: string): Promise<ChargePoint> => {
    const response = await api.get(`/charge-points/${id}`);
    return response.data;
  },

  /**
   * Start wallet-based charging
   */
  startWalletCharging: async (
    chargePointId: string,
    data: StartChargingRequest
  ): Promise<StartChargingResponse> => {
    const response = await api.post(
      `/charge-points/${chargePointId}/wallet-start`,
      data
    );
    return response.data;
  },

  /**
   * Stop charging transaction
   */
  stopTransaction: async (
    chargePointId: string,
    transactionId: number
  ): Promise<void> => {
    await api.post(`/charge-points/${chargePointId}/remote-stop`, {
      transactionId,
    });
  },
};
