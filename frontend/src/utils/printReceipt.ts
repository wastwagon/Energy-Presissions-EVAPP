import type { Invoice } from '../services/billingApi';
import type { Transaction } from '../services/transactionsApi';
import { formatCurrency, formatEnergyKwh } from './formatters';
import { formatCustomerDisplayName } from './sessionDisplay';

export type ReceiptBranding = {
  businessName?: string | null;
  locationLine?: string | null;
  customerName?: string | null;
  logoUrl?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function receiptBrandingFromTransaction(
  transaction?: Transaction | null,
): ReceiptBranding {
  if (!transaction) return {};
  return {
    businessName: transaction.vendorName ?? null,
    locationLine: transaction.locationName ?? transaction.chargePointId ?? null,
    customerName: formatCustomerDisplayName(transaction),
    logoUrl: transaction.vendorLogoUrl ?? null,
  };
}

export function openPrintableReceipt(
  invoice: Invoice,
  transaction?: Transaction | null,
  branding?: ReceiptBranding,
) {
  const resolved = {
    businessName: branding?.businessName ?? transaction?.vendorName ?? null,
    locationLine:
      branding?.locationLine ?? transaction?.locationName ?? transaction?.chargePointId ?? null,
    customerName:
      branding?.customerName ??
      (transaction ? formatCustomerDisplayName(transaction) : null),
    logoUrl: branding?.logoUrl ?? transaction?.vendorLogoUrl ?? null,
  };

  const currency = invoice.currency || 'GHS';
  const headerTitle = resolved.businessName?.trim() || 'Clean Motion Ghana';
  const headerSubtitle = resolved.locationLine?.trim() || 'EV charging receipt';
  const logoHtml =
    resolved.logoUrl?.trim()
      ? `<img src="${escapeHtml(resolved.logoUrl.trim())}" alt="" style="max-height:48px;max-width:160px;margin-bottom:8px;display:block" />`
      : '';

  const lines = [
    ['Invoice', invoice.invoiceNumber],
    ['Status', invoice.status],
    ['Date', new Date(invoice.createdAt).toLocaleString()],
    resolved.customerName ? ['Customer', resolved.customerName] : null,
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
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 32px; color: #111; max-width: 480px; }
  .brand { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e5e5e5; }
  h1 { font-size: 1.25rem; margin: 0 0 4px; }
  .muted { color: #666; font-size: 0.875rem; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; }
  @media print { body { margin: 16px; } }
</style></head><body>
  <div class="brand">
    ${logoHtml}
    <h1>${escapeHtml(headerTitle)}</h1>
    <p class="muted" style="margin:0">${escapeHtml(headerSubtitle)}</p>
  </div>
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
