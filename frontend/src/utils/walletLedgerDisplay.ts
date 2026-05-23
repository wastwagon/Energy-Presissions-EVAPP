import type { WalletTransaction } from '../services/walletApi';
import { PLATFORM_CURRENCY } from '../constants/platform';
import { formatCurrency } from './formatters';

/** Wallet ledger rows that reduce spendable balance (holds and debits). */
export function isWalletLedgerDebit(type: string): boolean {
  const t = type.toLowerCase();
  return t === 'debit' || t === 'payment' || t === 'reservation';
}

export function formatWalletLedgerAmount(tx: WalletTransaction): string {
  const currency = PLATFORM_CURRENCY;
  const abs = formatCurrency(Math.abs(tx.amount), currency);
  return isWalletLedgerDebit(tx.type) ? `−${abs}` : `+${abs}`;
}

export function walletLedgerAmountColor(type: string): 'error.main' | 'success.main' | 'text.secondary' {
  if (isWalletLedgerDebit(type)) return 'error.main';
  const t = type.toLowerCase();
  if (t === 'topup' || t === 'top_up' || t === 'credit' || t === 'refund') return 'success.main';
  return 'text.secondary';
}

export function formatWalletLedgerTypeLabel(type: string): string {
  const t = type.toLowerCase();
  if (t === 'reservation') return 'Hold';
  if (t === 'topup' || t === 'top_up') return 'Top up';
  return type.replace(/_/g, ' ');
}
