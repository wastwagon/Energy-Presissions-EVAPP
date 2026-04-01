export function formatCurrency(amount?: number | null, currency: string = 'GHS'): string {
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
    return '-';
  }
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency,
  }).format(Number(amount));
}

export function formatDurationMinutes(minutes?: number | null): string {
  if (minutes === undefined || minutes === null || Number.isNaN(Number(minutes))) {
    return '-';
  }
  const totalMinutes = Math.max(0, Math.floor(Number(minutes)));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function formatElapsedDurationFromStart(startTime: string): string {
  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) return '-';
  const diffMs = Date.now() - start.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  return formatDurationMinutes(diffMinutes);
}

export function formatEnergyKwh(value?: number | string | null, decimals: number = 2): string {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const numeric = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (Number.isNaN(numeric)) {
    return '-';
  }
  return numeric.toFixed(decimals);
}
