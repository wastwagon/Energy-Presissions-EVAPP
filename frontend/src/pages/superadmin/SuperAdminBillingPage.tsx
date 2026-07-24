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
  Alert,
  Tabs,
  Tab,
  Button,
  Pagination,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { openPrintableReceipt, receiptBrandingFromTransaction } from '../../utils/printReceipt';
import { billingApi, Invoice } from '../../services/billingApi';
import { transactionsApi, type Transaction } from '../../services/transactionsApi';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';
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
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { AppBadge, chipColorToBadgeTone } from '../../components/ui/AppBadge';
import { DashboardStaffChromeSkeleton } from '../../components/dashboard/DashboardStaffChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { MobileListLoadMore } from '../../components/ios/MobileListLoadMore';

const BILLING_PAGE_SIZE = 20;

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
  const [invPage, setInvPage] = useState(1);
  const [invTotal, setInvTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [loadingMoreInv, setLoadingMoreInv] = useState(false);
  const [loadingMoreTx, setLoadingMoreTx] = useState(false);

  const transactionByOcppId = useMemo(() => {
    const map = new Map<number, Transaction>();
    for (const tx of transactions) {
      if (tx.transactionId > 0) map.set(tx.transactionId, tx);
    }
    return map;
  }, [transactions]);

  const fetchInvoicesPage = useCallback(async (pageNum: number, append: boolean) => {
    const res = await billingApi.getInvoices(BILLING_PAGE_SIZE, (pageNum - 1) * BILLING_PAGE_SIZE);
    setInvoices((prev) => (append ? [...prev, ...(res.invoices || [])] : res.invoices || []));
    setInvTotal(res.total ?? 0);
    setInvPage(pageNum);
  }, []);

  const fetchTransactionsPage = useCallback(async (pageNum: number, append: boolean) => {
    const res = await transactionsApi.getAll(BILLING_PAGE_SIZE, (pageNum - 1) * BILLING_PAGE_SIZE);
    setTransactions((prev) => (append ? [...prev, ...res.transactions] : res.transactions));
    setTxTotal(res.total);
    setTxPage(pageNum);
  }, []);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await Promise.all([fetchInvoicesPage(1, false), fetchTransactionsPage(1, false)]);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err.response?.data?.message || err.message || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }, [fetchInvoicesPage, fetchTransactionsPage]);

  const handleLoadMoreInvoices = useCallback(async () => {
    if (loadingMoreInv || invPage * BILLING_PAGE_SIZE >= invTotal) return;
    setLoadingMoreInv(true);
    try {
      await fetchInvoicesPage(invPage + 1, true);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message || 'Failed to load more invoices');
    } finally {
      setLoadingMoreInv(false);
    }
  }, [fetchInvoicesPage, invPage, invTotal, loadingMoreInv]);

  const handleLoadMoreTransactions = useCallback(async () => {
    if (loadingMoreTx || txPage * BILLING_PAGE_SIZE >= txTotal) return;
    setLoadingMoreTx(true);
    try {
      await fetchTransactionsPage(txPage + 1, true);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message || 'Failed to load more sessions');
    } finally {
      setLoadingMoreTx(false);
    }
  }, [fetchTransactionsPage, loadingMoreTx, txPage, txTotal]);

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
      <LivePageHeader
        title="Billing & Invoices"
        subtitle={
          variant === 'admin'
            ? 'Vendor-scoped completed sessions and invoices. Network-wide tariffs may apply when no vendor tariff is active.'
            : 'Completed session billing and invoice generation. Active sessions show live estimates until stop.'
        }
        updatedAt={null}
        refreshing={false}
        onRefresh={() => undefined}
        showRefresh={false}
        showLiveMeta={false}
      />

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
          <Tab label={`Invoices (${invTotal})`} />
          <Tab label={`Sessions (${txTotal})`} />
        </Tabs>

        <TabPanel value={tab} index={0}>
          {invoices.length === 0 ? (
            <AppEmptyState
              sx={{ border: 0, boxShadow: 'none', borderRadius: 0, m: 0 }}
              icon={<ReceiptIcon />}
              title="No invoices yet"
              description="Generate an invoice from a completed session on the Sessions tab."
            />
          ) : useGroupedList ? (
            <>
            <GroupedListSection>
              {invoices.map((inv, index) => (
                <GroupedListRow
                  key={inv.id}
                  divider={index < invoices.length - 1}
                  showChevron={false}
                  primary={inv.invoiceNumber}
                  secondary={`User ${inv.userId} · ${new Date(inv.createdAt).toLocaleDateString()}`}
                  end={
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(inv.total, inv.currency || 'GHS')}
                      </Typography>
                      <AppBadge
                        label={inv.status}
                        tone={chipColorToBadgeTone(getInvoiceStatusColor(inv.status))}
                        sx={{ mt: 0.5, height: 22, display: 'flex', ml: 'auto' }}
                      />
                    </Box>
                  }
                />
              ))}
            </GroupedListSection>
            <MobileListLoadMore
              page={invPage}
              totalCount={invTotal}
              pageSize={BILLING_PAGE_SIZE}
              loading={loadingMoreInv}
              onLoadMore={() => void handleLoadMoreInvoices()}
            />
            </>
          ) : (
            <>
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
                        <AppBadge label={inv.status} tone={chipColorToBadgeTone(getInvoiceStatusColor(inv.status))} />
                      </TableCell>
                      <TableCell>{new Date(inv.createdAt).toLocaleString()}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {inv.pdfPath && (
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<PictureAsPdfIcon />}
                              onClick={() => billingApi.openInvoicePdfUrl(inv.pdfPath!)}
                              sx={(th) => sxObject(th, compactOutlinedCtaSx)}
                            >
                              PDF
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PrintIcon />}
                            onClick={() => {
                              const tx = inv.transactionId
                                ? transactionByOcppId.get(inv.transactionId) ?? null
                                : null;
                              openPrintableReceipt(
                                inv,
                                tx,
                                receiptBrandingFromTransaction(tx),
                              );
                            }}
                            sx={(th) => sxObject(th, compactOutlinedCtaSx)}
                          >
                            Print
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {invTotal > BILLING_PAGE_SIZE && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Pagination
                  count={Math.ceil(invTotal / BILLING_PAGE_SIZE)}
                  page={invPage}
                  onChange={(_, value) => void fetchInvoicesPage(value, false)}
                  color="primary"
                />
              </Box>
            )}
            </>
          )}
        </TabPanel>

        <TabPanel value={tab} index={1}>
          {transactions.length === 0 ? (
            <AppEmptyState
              sx={{ border: 0, boxShadow: 'none', borderRadius: 0 }}
              title="No transactions"
              description="Completed sessions ready for invoicing will appear here."
            />
          ) : useGroupedList ? (
            <>
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
                      <AppBadge
                        label={sessionStatusLabel(tx)}
                        tone={chipColorToBadgeTone(sessionStatusChipColor(sessionStatusLabel(tx)))}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  }
                />
              ))}
            </GroupedListSection>
            <MobileListLoadMore
              page={txPage}
              totalCount={txTotal}
              pageSize={BILLING_PAGE_SIZE}
              loading={loadingMoreTx}
              onLoadMore={() => void handleLoadMoreTransactions()}
            />
            </>
          ) : (
            <>
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
                        <AppBadge
                          label={sessionStatusLabel(tx)}
                          tone={chipColorToBadgeTone(sessionStatusChipColor(sessionStatusLabel(tx)))}
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
            {txTotal > BILLING_PAGE_SIZE && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Pagination
                  count={Math.ceil(txTotal / BILLING_PAGE_SIZE)}
                  page={txPage}
                  onChange={(_, value) => void fetchTransactionsPage(value, false)}
                  color="primary"
                />
              </Box>
            )}
            </>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
}

export function SuperAdminBillingPage() {
  return <StaffBillingPage variant="superadmin" />;
}
