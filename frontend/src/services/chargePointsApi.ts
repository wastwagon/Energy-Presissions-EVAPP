import { api } from './api';

export interface ChargePoint {
  id: number;
  chargePointId: string;
  vendor?: string; // Vendor relation (object)
  vendorId?: number;
  vendorName?: string; // Vendor name (string column)
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  status: string;
  lastHeartbeat?: string;
  lastSeen?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  locationAddress?: string;
  totalCapacityKw?: number;
  pricePerKwh?: number;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Connector {
  id: number;
  chargePointId: string;
  connectorId: number;
  connectorType?: string;
  powerRatingKw?: number;
  status: string;
  errorCode?: string;
  vendorErrorCode?: string;
  lastStatusUpdate?: string;
}

export interface ChargePointStatus {
  chargePoint: {
    id: string;
    status: string;
    lastSeen?: string;
    lastHeartbeat?: string;
  };
  connectors: Connector[];
  activeTransactions: number;
}

export const chargePointsApi = {
  getAll: async (search?: string): Promise<ChargePoint[]> => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await api.get(`/charge-points${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<ChargePoint> => {
    const response = await api.get(`/charge-points/${encodeURIComponent(id)}`);
    return response.data;
  },

  update: async (id: string, data: Partial<ChargePoint>): Promise<ChargePoint> => {
    const response = await api.put(`/charge-points/${encodeURIComponent(id)}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/charge-points/${encodeURIComponent(id)}`);
  },

  getStatus: async (id: string): Promise<ChargePointStatus> => {
    const response = await api.get(`/charge-points/${id}/status`);
    return response.data;
  },

  getConnectors: async (id: string): Promise<Connector[]> => {
    const response = await api.get(`/charge-points/${id}/connectors`);
    return response.data;
  },

  getConnector: async (id: string, connectorId: number): Promise<Connector> => {
    const response = await api.get(`/charge-points/${id}/connectors/${connectorId}`);
    return response.data;
  },

  remoteStart: async (id: string, connectorId: number, idTag: string) => {
    const response = await api.post(`/charge-points/${id}/remote-start`, {
      connectorId,
      idTag,
    });
    return response.data;
  },

  walletStart: async (id: string, connectorId: number, userId: number, amount: number) => {
    const response = await api.post(`/charge-points/${id}/wallet-start`, {
      connectorId,
      userId,
      amount,
    });
    return response.data;
  },

  remoteStop: async (id: string, transactionId: number) => {
    const response = await api.post(`/charge-points/${id}/remote-stop`, {
      transactionId,
    });
    return response.data;
  },

  unlockConnector: async (id: string, connectorId: number) => {
    const response = await api.post(`/charge-points/${id}/connectors/${connectorId}/unlock`);
    return response.data;
  },

  changeAvailability: async (
    id: string,
    connectorId: number,
    type: 'Inoperative' | 'Operative',
  ) => {
    const response = await api.post(`/charge-points/${id}/change-availability`, {
      connectorId,
      type,
    });
    return response.data;
  },

  getConfiguration: async (id: string, keys?: string[]) => {
    const params = keys ? `?keys=${keys.join(',')}` : '';
    const response = await api.get(`/charge-points/${id}/configuration${params}`);
    return response.data;
  },

  changeConfiguration: async (id: string, key: string, value: string) => {
    const response = await api.post(`/charge-points/${id}/configuration`, {
      key,
      value,
    });
    return response.data;
  },

  // Advanced features
  reset: async (id: string, type: 'Hard' | 'Soft') => {
    const response = await api.post(`/charge-points/${id}/reset`, { type });
    return response.data;
  },

  clearCache: async (id: string) => {
    const response = await api.post(`/charge-points/${id}/clear-cache`, {});
    return response.data;
  },

  reserveNow: async (
    id: string,
    connectorId: number,
    expiryDate: string,
    idTag: string,
    reservationId: number,
    parentIdTag?: string,
  ) => {
    const response = await api.post(`/charge-points/${id}/reserve-now`, {
      connectorId,
      expiryDate,
      idTag,
      reservationId,
      parentIdTag,
    });
    return response.data;
  },

  cancelReservation: async (id: string, reservationId: number) => {
    const response = await api.post(`/charge-points/${id}/cancel-reservation`, {
      reservationId,
    });
    return response.data;
  },

  sendLocalList: async (
    id: string,
    listVersion: number,
    updateType: 'Full' | 'Differential',
    localAuthorizationList?: any[],
  ) => {
    const response = await api.post(`/charge-points/${id}/send-local-list`, {
      listVersion,
      updateType,
      localAuthorizationList,
    });
    return response.data;
  },

  getLocalListVersion: async (id: string) => {
    const response = await api.get(`/charge-points/${id}/local-list-version`);
    return response.data;
  },

  setChargingProfile: async (id: string, connectorId: number, chargingProfile: any) => {
    const response = await api.post(`/charge-points/${id}/set-charging-profile`, {
      connectorId,
      chargingProfile,
    });
    return response.data;
  },

  clearChargingProfile: async (
    id: string,
    idParam?: number,
    connectorId?: number,
    chargingProfilePurpose?: string,
    stackLevel?: number,
  ) => {
    const response = await api.post(`/charge-points/${id}/clear-charging-profile`, {
      id: idParam,
      connectorId,
      chargingProfilePurpose,
      stackLevel,
    });
    return response.data;
  },

  getCompositeSchedule: async (
    id: string,
    connectorId: number,
    duration: number,
    chargingRateUnit?: 'A' | 'W',
  ) => {
    const params = new URLSearchParams();
    params.append('connectorId', connectorId.toString());
    params.append('duration', duration.toString());
    if (chargingRateUnit) params.append('chargingRateUnit', chargingRateUnit);
    const response = await api.get(`/charge-points/${id}/composite-schedule?${params.toString()}`);
    return response.data;
  },

  updateFirmware: async (
    id: string,
    location: string,
    retrieveDate: string,
    retryInterval?: number,
    retries?: number,
  ) => {
    const response = await api.post(`/charge-points/${id}/update-firmware`, {
      location,
      retrieveDate,
      retryInterval,
      retries,
    });
    return response.data;
  },

  getDiagnostics: async (
    id: string,
    location: string,
    startTime?: string,
    stopTime?: string,
    retryInterval?: number,
    retries?: number,
  ) => {
    const response = await api.post(`/charge-points/${id}/get-diagnostics`, {
      location,
      startTime,
      stopTime,
      retryInterval,
      retries,
    });
    return response.data;
  },

  dataTransfer: async (id: string, vendorId: string, messageId?: string, data?: string) => {
    const response = await api.post(`/charge-points/${id}/data-transfer`, {
      vendorId,
      messageId,
      data,
    });
    return response.data;
  },
};

