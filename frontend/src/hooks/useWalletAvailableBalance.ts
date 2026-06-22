import { useState, useEffect, useCallback } from 'react';
import { walletApi } from '../services/walletApi';
import { getStoredUser } from '../utils/authSession';
import { websocketService } from '../services/websocket';
import { MIN_WALLET_START_BALANCE } from '../constants/chargingWallet';

export function useWalletAvailableBalance(enabled = true) {
  const [available, setAvailable] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async (): Promise<number | null> => {
    if (!enabled) {
      setAvailable(null);
      return null;
    }
    const user = getStoredUser();
    const userId = typeof user?.id === 'number' ? user.id : null;
    if (!userId) {
      setAvailable(null);
      return null;
    }
    try {
      setLoading(true);
      const balance = await walletApi.getAvailableBalance(userId);
      setAvailable(balance.available);
      return balance.available;
    } catch {
      try {
        const fallback = await walletApi.getBalance(userId);
        setAvailable(fallback.balance);
        return fallback.balance;
      } catch {
        setAvailable(null);
        return null;
      }
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
    if (!enabled) return;

    const unsubWallet = websocketService.on('walletBalanceUpdate', (event) => {
      const user = getStoredUser();
      const userId = typeof user?.id === 'number' ? user.id : null;
      if (!userId || event.data.userId !== userId) return;
      if (typeof event.data.balance === 'number' && Number.isFinite(event.data.balance)) {
        setAvailable(event.data.balance);
      } else if (event.data.belowMinimum === true) {
        void reload();
      }
    });

    return () => {
      unsubWallet();
    };
  }, [enabled, reload]);

  const isBelowMinimum =
    available !== null && Number.isFinite(available) && available < MIN_WALLET_START_BALANCE;

  return { available, loading, isBelowMinimum, reload, minimumBalance: MIN_WALLET_START_BALANCE };
}
