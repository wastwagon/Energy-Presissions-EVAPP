import type { WalletTransaction } from '../services/walletApi';
import { isWalletLedgerDebit } from './walletLedgerDisplay';

/**
 * Daily net activity series for wallet sparkline (last N calendar days).
 * Debits count positive as spend; credits/top-ups count positive as inflow on a separate series path —
 * here we chart absolute money movement magnitude (spend + top-ups) for presence.
 */
export function buildWalletActivitySeries(
  transactions: WalletTransaction[],
  days = 14,
): { values: number[]; periodSpend: number; periodTopUp: number } {
  const dayKeys: string[] = [];
  const spendByDay = new Map<string, number>();
  const topUpByDay = new Map<string, number>();

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayKeys.push(key);
    spendByDay.set(key, 0);
    topUpByDay.set(key, 0);
  }

  let periodSpend = 0;
  let periodTopUp = 0;

  for (const tx of transactions) {
    const key = new Date(tx.createdAt).toISOString().slice(0, 10);
    if (!spendByDay.has(key)) continue;
    const amount = Math.abs(Number(tx.amount) || 0);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    if (isWalletLedgerDebit(tx.type)) {
      spendByDay.set(key, (spendByDay.get(key) ?? 0) + amount);
      periodSpend += amount;
    } else {
      const t = tx.type.toLowerCase();
      if (t === 'topup' || t === 'top_up' || t === 'credit' || t === 'refund') {
        topUpByDay.set(key, (topUpByDay.get(key) ?? 0) + amount);
        periodTopUp += amount;
      }
    }
  }

  // Activity = spend + top-ups so empty quiet days stay flat and funded days show presence.
  const values = dayKeys.map((key) => (spendByDay.get(key) ?? 0) + (topUpByDay.get(key) ?? 0));

  return { values, periodSpend, periodTopUp };
}
