import { useEffect, useState } from 'react';
import { transactionsApi } from '../services/transactionsApi';
import { getStoredUser } from '../utils/authSession';

/**
 * Live session count for the Charge tab badge. Quiet failures — the badge is decorative.
 */
export function useCustomerLiveSessionCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const user = getStoredUser();
      if (typeof user?.id !== 'number') {
        if (!cancelled) setCount(0);
        return;
      }
      try {
        const active = await transactionsApi.getActive(undefined, user.id);
        if (!cancelled) setCount(active?.length ?? 0);
      } catch {
        /* keep last known count */
      }
    };

    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return count;
}
