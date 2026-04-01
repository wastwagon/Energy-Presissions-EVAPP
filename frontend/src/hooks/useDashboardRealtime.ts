import { useEffect } from 'react';
import { websocketService } from '../services/websocket';

type DashboardRealtimeScope = 'admin' | 'superadmin';

export function useDashboardRealtime(
  reload: () => void,
  scope: DashboardRealtimeScope,
): void {
  useEffect(() => {
    const unsubscribeTransactionStarted = websocketService.on('transactionStarted', () => {
      reload();
    });

    const unsubscribeTransactionStopped = websocketService.on('transactionStopped', () => {
      reload();
    });

    const unsubscribeChargePointStatus = websocketService.on('chargePointStatus', () => {
      reload();
    });

    const unsubscribeDashboardStats = websocketService.on('dashboardStatsUpdate', (event) => {
      if (scope === 'admin') {
        const vendorId = localStorage.getItem('currentVendorId');
        if (!vendorId || event.data.vendorId?.toString() === vendorId) {
          reload();
        }
        return;
      }
      reload();
    });

    return () => {
      unsubscribeTransactionStarted();
      unsubscribeTransactionStopped();
      unsubscribeChargePointStatus();
      unsubscribeDashboardStats();
    };
  }, [reload, scope]);
}
