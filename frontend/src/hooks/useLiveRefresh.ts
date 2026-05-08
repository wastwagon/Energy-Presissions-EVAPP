import { useState, useCallback } from 'react';

/**
 * Shared loading model for pages that need:
 * - initial blocking load
 * - silent in-place refresh
 * - "last updated" timestamp for trust cues
 *
 * `runWithRefresh` is stable so `useCallback(..., [runWithRefresh])` + `useEffect` do not thrash (avoids freezes).
 */
export function useLiveRefresh() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const runWithRefresh = useCallback(async (work: () => Promise<void | boolean>, silent?: boolean) => {
    const isQuiet = silent === true;
    if (isQuiet) setRefreshing(true);
    else setLoading(true);

    try {
      const success = await work();
      if (success !== false) {
        setUpdatedAt(Date.now());
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  return { loading, refreshing, updatedAt, runWithRefresh };
}
