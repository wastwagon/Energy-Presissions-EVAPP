import type { Transaction } from '../services/transactionsApi';
import type { StaffPeriodDays } from '../components/dashboard/StaffPeriodChips';

/** Keep sessions whose start time falls within the last `days` calendar days. */
export function filterTransactionsByPeriodDays(
  rows: Transaction[],
  days: StaffPeriodDays,
): Transaction[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return rows.filter((tx) => {
    const t = new Date(tx.startTime).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });
}

export function reportExportFilename(prefix: string, days: StaffPeriodDays): string {
  return `${prefix}-${days}d-${new Date().toISOString().slice(0, 10)}.csv`;
}
