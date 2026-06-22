import { useState, useEffect, useCallback, useMemo } from 'react';
import { transactionsApi, type Transaction } from '../services/transactionsApi';
import { getStoredUser } from '../utils/authSession';
import { websocketService } from '../services/websocket';

export function useCustomerActiveSessions(enabled = true) {
  const [sessions, setSessions] = useState<Transaction[]>([]);

  const reload = useCallback(async () => {
    const user = getStoredUser();
    const userId = typeof user?.id === 'number' ? user.id : null;
    if (!userId) {
      setSessions([]);
      return;
    }
    try {
      const active = await transactionsApi.getActive(undefined, userId);
      setSessions(active);
    } catch {
      // Keep last known sessions on transient errors
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setSessions([]);
      return;
    }

    void reload();
    const interval = setInterval(() => void reload(), 10000);
    const unsubMeter = websocketService.on('meterValue', () => void reload());
    const unsubStopped = websocketService.on('transactionStopped', () => void reload());
    const unsubStarted = websocketService.on('transactionStarted', () => void reload());

    return () => {
      clearInterval(interval);
      unsubMeter();
      unsubStopped();
      unsubStarted();
    };
  }, [enabled, reload]);

  const byChargePointId = useMemo(() => {
    const map = new Map<string, Transaction>();
    for (const tx of sessions) {
      if (!map.has(tx.chargePointId)) {
        map.set(tx.chargePointId, tx);
      }
    }
    return map;
  }, [sessions]);

  return { sessions, byChargePointId, reload };
}
