import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Tabs,
  Tab,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PrintIcon from '@mui/icons-material/Print';
import { openPrintableReceipt, receiptBrandingFromTransaction } from '../../utils/printReceipt';
import { billingApi, Invoice } from '../../services/billingApi';
import { transactionsApi, type Transaction } from '../../services/transactionsApi';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';
import { dashboardPageTitleSx, dashboardPageSubtitleSx } from '../../theme/jampackShell';
import { compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { formatCurrency } from '../../utils/formatters';
import { getInvoiceStatusColor } from '../../utils/statusColors';
import {
  formatCustomerDisplayName,
  formatSessionCost,
  formatSessionEnergy,
  sessionStatusChipColor,
  sessionStatusLabel,
} from '../../utils/sessionDisplay';
import { DashboardStaffChromeSkeleton } from '../../components/dashboard/DashboardStaffChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';

function TabPanel({ children, value, index }: { children: ReactNode; value: number; index: number }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && (
        <Box sx={{ pt: 2, px: { xs: 1.5, sm: 2 }, pb: { xs: 2, sm: 2 } }}>{children}</Box>
      )}
    </div>
  );
}

export type StaffBillingVariant = 'admin' | 'superadmin';

export function StaffBillingPage({ variant = 'superadmin' }: { variant?: StaffBillingVariant }) {
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [tab, setTab] = useState(0);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  const transactionByOcppId = useMemo(() => {
    const map = new Map<number, Transaction>();
    for (const tx of transactions) {
      if (tx.transactionId > 0) map.set(tx.transactionId, tx);
    }
    return map;
  }, [transactions]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [inv, tx] = await Promise.all([
        billingApi.getInvoices(100, 0).catch(() => ({ invoices: [], total: 0 })),
        transactionsApi.getAll(100, 0).catch(() => ({ transactions: [], total: 0 })),
      ]);
      setInvoices(inv.invoices || []);
      setTransactions(tx.transactions || []);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err.response?.data?.message || err.message || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleGenerateInvoice = async (transactionId: number) => {
    setGeneratingId(transactionId);
    setError(null);
    try {
      const inv = await billingApi.generateInvoice(transactionId);
      setNotice(`Invoice ${inv.invoiceNumber} created`);
      await load();
      setTab(0);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err.response?.data?.message || err.message || 'Failed to generate invoice');
    } finally {
      setGeneratingId(null);
    }
  };

  if (loading && invoices.length === 0 && transactions.length === 0) {
    return <DashboardStaffChromeSkeleton preset="billingTabs" />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
          <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
            Billing & Invoices
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            {variant === 'admin'
              ? 'Vendor-scoped completed sessions and invoices. Network-wide tariffs may apply when no vendor tariff is active.'
              : 'Completed session billing and invoice generation. Active sessions show live estimates until stop.'}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      <Paper elevation={0} sx={{ ...premiumTableSurfaceSx, position: 'relative' }}>
        <TableSurfaceProgress
          active={loading && (invoices.length > 0 || transactions.length > 0)}
          ariaLabel="Loading billing data"
        />
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            px: { xs: 1, sm: 2 },
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': { minHeight: 48, textTransform: 'none', fontWeight: 600 },
          }}
        >
          <Tab label={`Invoices (${invoices.length})`} />
          <Tab label={`Sessions (${transactions.length})`} />
        </Tabs>

        <TabPanel value={tab} index={0}>
          {invoices.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No invoices yet. Generate one from a completed session.
            </Typography>
          ) : (
            <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice #</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Receipt</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} hover>
                      <TableCell>{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.userId}</TableCell>
                      <TableCell>{formatCurrency(inv.total, inv.currency || 'GHS')}</TableCell>
                      <TableCell>
                        <Chip label={inv.status} color={getInvoiceStatusColor(inv.status)} size="small" />
                      </TableCell>
                      <TableCell>{new Date(inv.createdAt).toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PrintIcon />}
                          onClick={() =>
                            (() => {
                              const tx = inv.transactionId
                                ? transactionByOcppId.get(inv.transactionId) ?? null
                                : null;
                              openPrintableReceipt(
                                inv,
                                tx,
                                receiptBrandingFromTransaction(tx),
                              );
                            })()
                          }
                          sx={(th) => sxObject(th, compactOutlinedCtaSx)}
                        >
                          Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tab} index={1}>
          {transactions.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No transactions
            </Typography>
          ) : useGroupedList ? (
            <GroupedListSection>
              {transactions.map((tx, index) => (
                <GroupedListRow
                  key={`${tx.id}-${tx.transactionId}`}
                  divider={index < transactions.length - 1}
                  showChevron={false}
                  primary={formatCustomerDisplayName(tx)}
                  secondary={`#${tx.transactionId} · ${formatSessionEnergy(tx)}`}
                  end={
                    <Box sx={{ textAlign: 'right', minWidth: 88 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatSessionCost(tx)}
                      </Typography>
                      {tx.status === 'Completed' && Number(tx.totalCost) > 0 && (
                        <Button
                          size="small"
                          startIcon={<ReceiptIcon sx={{ fontSize: 16 }} />}
                          disabled={generatingId === tx.transactionId}
                          onClick={() => void handleGenerateInvoice(tx.transactionId)}
                          sx={{ mt: 0.5, minHeight: 32, fontSize: '0.75rem' }}
                        >
                          Invoice
                        </Button>
                      )}
                      <Chip
                        label={sessionStatusLabel(tx)}
                        color={sessionStatusChipColor(sessionStatusLabel(tx))}
                        size="small"
                        sx={{ mt: 0.5, height: 22, display: 'block', ml: 'auto' }}
                      />
                    </Box>
                  }
                />
              ))}
            </GroupedListSection>
          ) : (
            <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Transaction</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Cost</TableCell>
                    <TableCell>Energy</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Start</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={`${tx.id}-${tx.transactionId}`} hover>
                      <TableCell>{tx.transactionId}</TableCell>
                      <TableCell>{formatCustomerDisplayName(tx)}</TableCell>
                      <TableCell>{formatSessionCost(tx)}</TableCell>
                      <TableCell>{formatSessionEnergy(tx)}</TableCell>
                      <TableCell>
                        <Chip
                          label={sessionStatusLabel(tx)}
                          color={sessionStatusChipColor(sessionStatusLabel(tx))}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{tx.startTime ? new Date(tx.startTime).toLocaleString() : '—'}</TableCell>
                      <TableCell align="right">
                        {tx.status === 'Completed' && Number(tx.totalCost) > 0 && (
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ReceiptIcon />}
                            disabled={generatingId === tx.transactionId}
                            onClick={() => void handleGenerateInvoice(tx.transactionId)}
                            sx={(th) => sxObject(th, compactOutlinedCtaSx)}
                          >
                            {generatingId === tx.transactionId ? '…' : 'Invoice'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
}

export function SuperAdminBillingPage() {
  return <StaffBillingPage variant="superadmin" />;
}
