import { formatCurrency } from './formatters';

export type StaffDashboardInsightInput = {
  periodDays: number;
  revenueTrendPercent: number | null;
  offlineCount: number;
  activeSessions: number;
  pendingWalletReserved: number;
  devicesWithErrors?: number;
  /** Vendor dashboards use Sales; network uses Revenue. */
  moneyNoun?: 'Sales' | 'Revenue';
};

function statusCount(
  rows: Array<{ status: string; count: number }> | undefined,
  match: RegExp,
): number {
  if (!rows?.length) return 0;
  return rows.filter((r) => match.test(r.status)).reduce((sum, r) => sum + r.count, 0);
}

export function countChargePointsByStatus(
  rows: Array<{ status: string; count: number }> | undefined,
  match: RegExp,
): number {
  return statusCount(rows, match);
}

/** One-line insight for the staff decision home — what changed and what to do. */
export function buildStaffDashboardInsight({
  periodDays,
  revenueTrendPercent,
  offlineCount,
  activeSessions,
  pendingWalletReserved,
  devicesWithErrors = 0,
  moneyNoun = 'Revenue',
}: StaffDashboardInsightInput): string {
  if (offlineCount > 0) {
    return `${offlineCount} station${offlineCount === 1 ? ' is' : 's are'} offline — open Devices to reconnect.`;
  }
  if (devicesWithErrors > 0) {
    return `${devicesWithErrors} device${devicesWithErrors === 1 ? '' : 's'} need attention.`;
  }
  if (pendingWalletReserved > 0) {
    return `${formatCurrency(pendingWalletReserved)} in wallet holds is not counted as ${moneyNoun.toLowerCase()} until sessions complete.`;
  }
  if (revenueTrendPercent != null && revenueTrendPercent <= -5) {
    return `${moneyNoun} is down ${Math.abs(Math.round(revenueTrendPercent))}% vs earlier in this ${periodDays}-day period.`;
  }
  if (revenueTrendPercent != null && revenueTrendPercent >= 5) {
    return `${moneyNoun} is up ${Math.round(revenueTrendPercent)}% vs earlier in this ${periodDays}-day period.`;
  }
  if (activeSessions > 0) {
    return `${activeSessions} session${activeSessions === 1 ? '' : 's'} charging now.`;
  }
  return `No live sessions. The last ${periodDays} days are in the trend below.`;
}
