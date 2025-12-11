import { api } from './api';

export interface Transaction {
  id: number;
  transactionId: number;
  chargePointId: string;
  connectorId: number;
  idTag?: string;
  userId?: number;
  meterStart: number;
  meterStop?: number;
  startTime: string;
  stopTime?: string;
  totalEnergyKwh?: number;
  durationMinutes?: number;
  totalCost?: number;
  currency: string;
  status: string;
  reason?: string;
  reservationId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MeterSample {
  id: number;
  transactionId?: number;
  chargePointId: string;
  connectorId: number;
  timestamp: string;
  measurand?: string;
  location?: string;
  phase?: string;
  unit?: string;
  value: number;
  context?: string;
  format?: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
}

export const transactionsApi = {
  getAll: async (
    limit?: number,
    offset?: number,
    chargePointId?: string,
  ): Promise<TransactionsResponse> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    if (chargePointId) params.append('chargePointId', chargePointId);

    const response = await api.get(`/transactions?${params.toString()}`);
    return response.data;
  },

  getActive: async (): Promise<Transaction[]> => {
    const response = await api.get('/transactions/active');
    return response.data;
  },

  getById: async (id: number): Promise<Transaction> => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  getMeterValues: async (id: number): Promise<MeterSample[]> => {
    const response = await api.get(`/transactions/${id}/meter-values`);
    return response.data;
  },
};



