import type { Transaction } from '../services/transactionsApi';

/**
 * Most recent session that has ended (not Active), for “last charge” UI.
 */
export function pickLastEndedChargingSession(
  transactions: Transaction[] | null | undefined,
): Transaction | null {
  if (!transactions?.length) return null;
  const withEnd = transactions.filter(
    (t) =>
      t.stopTime &&
      t.status !== 'Active' &&
      (t.totalEnergyKwh != null || t.totalCost != null || t.meterStop != null),
  );
  if (withEnd.length === 0) return null;
  return withEnd.sort(
    (a, b) => new Date(b.stopTime || b.startTime).getTime() - new Date(a.stopTime || a.startTime).getTime(),
  )[0]!;
}
