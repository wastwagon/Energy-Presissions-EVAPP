import type { RevenueTrendPoint } from '../services/dashboardApi';

export type RevenueTrendCompare = {
  periodRevenue: number;
  periodSessions: number;
  /** % change later half vs earlier half of the series; null if not meaningful */
  revenueTrendPercent: number | null;
  sessionsTrendPercent: number | null;
  sparkRevenue: number[];
  sparkSessions: number[];
};

function sumKey(points: RevenueTrendPoint[], key: 'revenue' | 'sessions'): number {
  return points.reduce((acc, p) => acc + (Number(p[key]) || 0), 0);
}

function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) {
    if (current === 0) return 0;
    return null;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Split the daily series in half to estimate period-over-period change
 * without a second API call.
 */
export function compareRevenueTrend(points: RevenueTrendPoint[]): RevenueTrendCompare {
  const sparkRevenue = points.map((p) => Number(p.revenue) || 0);
  const sparkSessions = points.map((p) => Number(p.sessions) || 0);
  const periodRevenue = sumKey(points, 'revenue');
  const periodSessions = sumKey(points, 'sessions');

  if (points.length < 4) {
    return {
      periodRevenue,
      periodSessions,
      revenueTrendPercent: null,
      sessionsTrendPercent: null,
      sparkRevenue,
      sparkSessions,
    };
  }

  const mid = Math.floor(points.length / 2);
  const earlier = points.slice(0, mid);
  const later = points.slice(mid);

  return {
    periodRevenue,
    periodSessions,
    revenueTrendPercent: percentChange(sumKey(later, 'revenue'), sumKey(earlier, 'revenue')),
    sessionsTrendPercent: percentChange(sumKey(later, 'sessions'), sumKey(earlier, 'sessions')),
    sparkRevenue,
    sparkSessions,
  };
}

export function formatTrendPercent(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}%`;
}
