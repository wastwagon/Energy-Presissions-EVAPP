import { api } from './api';

export type OpsMaintenanceResult = {
  walletHoldsReleased: number;
  sweep: {
    chargePointsProcessed: number;
    connectorsCleared: number;
    chargePointIds: string[];
    skippedActiveSession: string[];
  };
};

export const maintenanceApi = {
  runOpsMaintenance: async (opts?: {
    releaseWalletHours?: number;
    sweepConnectorMinutes?: number;
  }): Promise<OpsMaintenanceResult> => {
    const params = new URLSearchParams();
    if (opts?.releaseWalletHours != null) {
      params.append('releaseWalletHours', String(opts.releaseWalletHours));
    }
    if (opts?.sweepConnectorMinutes != null) {
      params.append('sweepConnectorMinutes', String(opts.sweepConnectorMinutes));
    }
    const qs = params.toString();
    const response = await api.post(
      `/dashboard/ops/maintenance${qs ? `?${qs}` : ''}`,
    );
    return response.data;
  },
};
