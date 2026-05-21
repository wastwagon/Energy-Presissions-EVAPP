import type { Invoice } from '../services/billingApi';
import type { Transaction } from '../services/transactionsApi';
import { formatCurrency, formatEnergyKwh } from './formatters';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function openPrintableReceipt(invoice: Invoice, transaction?: Transaction | null) {
  const currency = invoice.currency || 'GHS';
  const lines = [
    ['Invoice', invoice.invoiceNumber],
    ['Status', invoice.status],
    ['Date', new Date(invoice.createdAt).toLocaleString()],
    transaction?.chargePointId ? ['Charge point', transaction.chargePointId] : null,
    transaction?.totalEnergyKwh != null
      ? ['Energy', `${formatEnergyKwh(transaction.totalEnergyKwh)} kWh`]
      : null,
    invoice.subtotal != null ? ['Subtotal', formatCurrency(invoice.subtotal, currency)] : null,
    invoice.tax != null && Number(invoice.tax) > 0
      ? ['Tax', formatCurrency(invoice.tax, currency)]
      : null,
    ['Total', formatCurrency(invoice.total ?? 0, currency)],
  ].filter(Boolean) as [string, string][];

  const bodyRows = lines
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 0;color:#666">${escapeHtml(label)}</td><td style="padding:8px 0;text-align:right;font-weight:600">${escapeHtml(value)}</td></tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>${escapeHtml(invoice.invoiceNumber)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 32px; color: #111; }
  h1 { font-size: 1.25rem; margin: 0 0 4px; }
  .muted { color: #666; font-size: 0.875rem; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; }
  @media print { body { margin: 16px; } }
</style></head><body>
  <h1>Charging receipt</h1>
  <p class="muted">Save as PDF via Print → Save as PDF</p>
  <table>${bodyRows}</table>
</body></html>`;

  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}
