import { api } from './api';

export interface Transaction {
  id: number;
  transactionId: number;
  chargePointId: string;
  connectorId: number;
  /** Backend could not correlate OCPP charging with a CSMS transaction row yet */
  recordPending?: boolean;
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
  walletReservedAmount?: number;
  billingMode?: string | null;
  billedCostSoFar?: number | null;
  /** Populated for Active sessions from latest OCPP meter register. */
  liveEnergyKwh?: number | null;
  /** Estimated cost so far (kWh × tariff, capped at wallet hold). */
  liveCostSoFar?: number | null;
  customerName?: string | null;
  customerEmail?: string | null;
  locationName?: string | null;
  vendorName?: string | null;
  vendorLogoUrl?: string | null;
  vendorBusinessName?: string | null;
  vendorReceiptHeaderText?: string | null;
  vendorReceiptFooterText?: string | null;
  vendorAddress?: string | null;
  vendorSupportEmail?: string | null;
  vendorSupportPhone?: string | null;
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
    vendorId?: number,
    userId?: number,
  ): Promise<TransactionsResponse> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    if (chargePointId) params.append('chargePointId', chargePointId);
    if (vendorId) params.append('vendorId', vendorId.toString());
    if (userId) params.append('userId', userId.toString());

    const response = await api.get(`/transactions?${params.toString()}`);
    return response.data;
  },

  getActive: async (vendorId?: number, userId?: number): Promise<Transaction[]> => {
    const params = new URLSearchParams();
    if (vendorId) params.append('vendorId', vendorId.toString());
    if (userId) params.append('userId', userId.toString());
    const query = params.toString();
    const response = await api.get(`/transactions/active${query ? `?${query}` : ''}`);
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



