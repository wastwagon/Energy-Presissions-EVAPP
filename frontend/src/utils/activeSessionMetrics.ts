import type { Transaction } from '../services/transactionsApi';
import { PLATFORM_CURRENCY } from '../constants/platform';
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

function isLegacyReservedSession(tx: Transaction): boolean {
  return (
    tx.billingMode === 'reserved' ||
    (tx.walletReservedAmount != null && Number(tx.walletReservedAmount) > 0 && tx.billingMode !== 'metered')
  );
}

/** Display cost: amount charged so far (metered) or estimate / legacy hold. */
export function formatActiveSessionCost(tx: Transaction): string {
  const currency = PLATFORM_CURRENCY;
  const reserved = tx.walletReservedAmount;
  const hasLegacyHold = isLegacyReservedSession(tx);

  if (tx.billedCostSoFar != null && Number.isFinite(Number(tx.billedCostSoFar)) && Number(tx.billedCostSoFar) > 0) {
    return formatCurrency(tx.billedCostSoFar, currency);
  }

  if (tx.liveCostSoFar != null && Number.isFinite(Number(tx.liveCostSoFar))) {
    const est = formatCurrency(tx.liveCostSoFar, currency);
    if (hasLegacyHold && reserved != null && Number(reserved) > 0) {
      return `${est} / ${formatCurrency(reserved, currency)} max`;
    }
    return est;
  }

  if (hasLegacyHold && reserved != null && Number.isFinite(Number(reserved))) {
    return `${formatCurrency(reserved, currency)} reserved`;
  }

  if (tx.totalCost != null && Number.isFinite(Number(tx.totalCost))) {
    return formatCurrency(tx.totalCost, currency);
  }

  return '—';
}

/** @deprecated Legacy reserved-cap sessions only */
export function formatActiveSessionPurchased(tx: Transaction): string {
  const currency = PLATFORM_CURRENCY;
  const reserved = tx.walletReservedAmount;
  if (reserved == null || !Number.isFinite(Number(reserved)) || Number(reserved) <= 0) {
    return '—';
  }
  return formatCurrency(reserved, currency);
}

/** @deprecated Legacy reserved-cap sessions only */
export function activeSessionHasWalletHold(tx: Transaction): boolean {
  return isLegacyReservedSession(tx);
}
