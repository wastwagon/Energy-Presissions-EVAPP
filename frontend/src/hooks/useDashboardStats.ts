import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { dashboardApi, DashboardStats } from '../services/dashboardApi';

/**
 * Loads dashboard KPI data with:
 * - Abortable requests (avoids races and updates after unmount)
 * - Initial full-page load vs in-place refresh (manual + realtime) without blanking the page
 */
export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const statsRef = useRef<DashboardStats | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadStats = useCallback(async (silent?: boolean) => {
    const isQuiet = silent === true;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (!mountedRef.current) return;

      if (isQuiet) {
        setRefreshing(true);
      } else if (statsRef.current == null) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const data = await dashboardApi.getStats({ signal: controller.signal });
      if (mountedRef.current) {
        statsRef.current = data;
        setStats(data);
        setUpdatedAt(Date.now());
      }
    } catch (err: unknown) {
      if (axios.isCancel(err)) return;
      console.error('Error loading dashboard stats:', err);
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load dashboard statistics';
        setError(message);
      }
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadStats(false);
  }, [loadStats]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { stats, loading, refreshing, error, updatedAt, loadStats, setError };
}
