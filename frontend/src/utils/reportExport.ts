import type { Transaction } from '../services/transactionsApi';
import {
  formatCustomerDisplayName,
  formatSessionCost,
  formatSessionDuration,
  formatSessionEnergy,
  sessionStatusLabel,
} from './sessionDisplay';

export function downloadSessionsReportCsv(rows: Transaction[], filename: string) {
  const headers = [
    'Transaction ID',
    'Customer',
    'Charge Point',
    'Connector',
    'Energy',
    'Duration',
    'Cost',
    'Status',
    'Start',
  ];
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    headers.join(','),
    ...rows.map((tx) =>
      [
        tx.recordPending ? 'Pending sync' : String(tx.transactionId),
        formatCustomerDisplayName(tx),
        tx.chargePointId,
        String(tx.connectorId),
        formatSessionEnergy(tx),
        formatSessionDuration(tx),
        formatSessionCost(tx),
        sessionStatusLabel(tx),
        new Date(tx.startTime).toISOString(),
      ]
        .map(escape)
        .join(','),
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
) {
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => escape(cell == null ? '' : String(cell))).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
