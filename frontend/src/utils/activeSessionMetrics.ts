import type { Transaction } from '../services/transactionsApi';
import { formatCurrency, formatEnergyKwh } from './formatters';

/** Display energy for an in-progress session (live meter when available). */
export function formatActiveSessionEnergy(tx: Transaction): string {
  const kwh = tx.liveEnergyKwh ?? tx.totalEnergyKwh;
  if (kwh !== undefined && kwh !== null && Number.isFinite(Number(kwh))) {
    return `${formatEnergyKwh(kwh)} kWh`;
  }
  if (tx.recordPending) {
    return 'Syncing…';
  }
  return 'Waiting for meter';
}

/** Display cost: estimated spend so far, or wallet hold, or dash. */
export function formatActiveSessionCost(tx: Transaction): string {
  const currency = tx.currency || 'GHS';
  const reserved = tx.walletReservedAmount;
  const hasHold = reserved != null && Number(reserved) > 0;

  if (tx.liveCostSoFar != null && Number.isFinite(Number(tx.liveCostSoFar))) {
    const est = `${formatCurrency(tx.liveCostSoFar, currency)} est.`;
    if (hasHold) {
      return `${est} / ${formatCurrency(reserved, currency)} max`;
    }
    return est;
  }
  if (hasHold) {
    return `${formatCurrency(reserved, currency)} reserved`;
  }
  if (tx.totalCost != null && Number.isFinite(Number(tx.totalCost))) {
    return formatCurrency(tx.totalCost, currency);
  }
  return '—';
}

/** Amount purchased (wallet hold) for this session. */
export function formatActiveSessionPurchased(tx: Transaction): string {
  const currency = tx.currency || 'GHS';
  const reserved = tx.walletReservedAmount;
  if (reserved == null || !Number.isFinite(Number(reserved)) || Number(reserved) <= 0) {
    return '—';
  }
  return formatCurrency(reserved, currency);
}

export function activeSessionHasWalletHold(tx: Transaction): boolean {
  return tx.walletReservedAmount != null && Number(tx.walletReservedAmount) > 0;
}
