import type { Transaction } from '../services/transactionsApi';
import { PLATFORM_CURRENCY } from '../constants/platform';
import { formatCurrency, formatDurationMinutes, formatEnergyKwh } from './formatters';
import { formatActiveSessionCost, formatActiveSessionEnergy } from './activeSessionMetrics';

export function sessionCurrency(_tx?: Transaction): string {
  return PLATFORM_CURRENCY;
}

export function formatSessionEnergy(tx: Transaction): string {
  if (tx.status === 'Active') {
    return formatActiveSessionEnergy(tx);
  }
  const kwh = tx.totalEnergyKwh;
  if (kwh === undefined || kwh === null) return '—';
  return `${formatEnergyKwh(kwh)} kWh`;
}

export function formatSessionDuration(tx: Transaction): string {
  if (tx.status === 'Active' && !tx.durationMinutes) {
    return '—';
  }
  return formatDurationMinutes(tx.durationMinutes);
}

export function formatSessionCost(tx: Transaction): string {
  if (tx.status === 'Active') {
    return formatActiveSessionCost(tx);
  }
  const cost = tx.totalCost;
  if (cost === undefined || cost === null) return '—';
  return formatCurrency(cost, sessionCurrency(tx));
}

export function formatSessionReserved(tx: Transaction): string {
  const v = tx.walletReservedAmount;
  if (v == null || !Number.isFinite(Number(v)) || Number(v) <= 0) return '—';
  return formatCurrency(v, sessionCurrency(tx));
}

/** Completed session with no meaningful energy recorded. */
export function isNoEnergyCompleted(tx: Transaction): boolean {
  if (tx.status !== 'Completed') return false;
  const kwh = Number(tx.totalEnergyKwh);
  return !Number.isFinite(kwh) || kwh < 0.001;
}

export function sessionStatusLabel(tx: Transaction): string {
  if (isNoEnergyCompleted(tx)) return 'Completed · no energy';
  if (tx.recordPending) return 'Syncing';
  return tx.status;
}

export function sessionStatusChipColor(
  status: string,
): 'success' | 'info' | 'warning' | 'error' | 'default' {
  if (status.includes('no energy')) return 'warning';
  if (status === 'Completed') return 'success';
  if (status === 'Active') return 'info';
  if (status === 'Failed' || status === 'Cancelled') return 'error';
  return 'default';
}

export function formatCustomerDisplayName(tx: Transaction): string {
  if (tx.customerName?.trim()) return tx.customerName.trim();
  if (tx.customerEmail?.trim()) return tx.customerEmail.trim();
  return tx.idTag || '—';
}
