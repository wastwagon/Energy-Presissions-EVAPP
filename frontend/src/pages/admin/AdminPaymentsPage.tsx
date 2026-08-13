import { useState, useEffect, useCallback, useMemo } from 'react';
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
  TextField,
  InputAdornment,
  IconButton,
  Pagination,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import PaymentIcon from '@mui/icons-material/Payment';
import { paymentsApi, Payment } from '../../services/paymentsApi';
import { getStoredAccountType } from '../../utils/authSession';
import { formatCurrency } from '../../utils/formatters';
import { getPaymentStatusColor } from '../../utils/statusColors';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';
import { staffLargeSubtitleSx, staffLargeTitleSx } from '../../theme/staffChrome';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { StaffFilterBar } from '../../components/dashboard/StaffFilterBar';
import { StaffStatusTabs } from '../../components/dashboard/StaffStatusTabs';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { AppBadge, chipColorToBadgeTone } from '../../components/ui/AppBadge';
import { useStaffPullRefresh } from '../../hooks/useStaffPullRefresh';
import { staffFilterFieldSx, premiumIconButtonTouchSx, sxObject } from '../../styles/authShell';
import { DashboardStaffChromeSkeleton } from '../../components/dashboard/DashboardStaffChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { MobileListLoadMore } from '../../components/ios/MobileListLoadMore';

const PAYMENTS_PAGE_SIZE = 20;

type PaymentStatusTab = 'all' | 'succeeded' | 'pending' | 'failed';

function matchesPaymentStatus(payment: Payment, tab: PaymentStatusTab): boolean {
  if (tab === 'all') return true;
  const status = (payment.status || '').toLowerCase();
  if (tab === 'succeeded') return status === 'succeeded' || status === 'completed' || status === 'paid';
  if (tab === 'pending') return status === 'pending' || status === 'processing';
  return status === 'failed' || status === 'cancelled' || status === 'canceled' || status === 'refunded';
}

export function AdminPaymentsPage() {
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState<PaymentStatusTab>('all');
  const [page, setPage] = useState(1);

  const isStaffListApi = useCallback(() => {
    const accountType = getStoredAccountType();
    return accountType === 'Admin' || accountType === 'SuperAdmin';
  }, []);

  const fetchPaymentsPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!isStaffListApi()) {
        const response = await paymentsApi.getUserPayments();
        const paymentsList = Array.isArray(response) ? response : response.payments || [];
        setPayments(paymentsList);
        setTotalPayments(paymentsList.length);
        setPage(1);
        return;
      }
      const { payments: list, total } = await paymentsApi.getAllPayments(
        PAYMENTS_PAGE_SIZE,
        (pageNum - 1) * PAYMENTS_PAGE_SIZE,
      );
      setPayments((prev) => (append ? [...prev, ...list] : list));
      setTotalPayments(total);
      setPage(pageNum);
    },
    [isStaffListApi],
  );

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchPaymentsPage(1, false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchPaymentsPage]);

  const handleLoadMore = useCallback(async () => {
    if (!isStaffListApi() || loadingMore || page * PAYMENTS_PAGE_SIZE >= totalPayments) return;
    setLoadingMore(true);
    try {
      setError(null);
      await fetchPaymentsPage(page + 1, true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load more payments');
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPaymentsPage, isStaffListApi, loadingMore, page, totalPayments]);

  const handleDesktopPageChange = useCallback(
    async (_: unknown, value: number) => {
      try {
        setLoading(true);
        setError(null);
        await fetchPaymentsPage(value, false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    },
    [fetchPaymentsPage],
  );

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  useStaffPullRefresh(loadPayments);

  const statusCounts = useMemo(() => {
    const counts = { all: payments.length, succeeded: 0, pending: 0, failed: 0 };
    for (const payment of payments) {
      if (matchesPaymentStatus(payment, 'succeeded')) counts.succeeded += 1;
      else if (matchesPaymentStatus(payment, 'pending')) counts.pending += 1;
      else if (matchesPaymentStatus(payment, 'failed')) counts.failed += 1;
    }
    return counts;
  }, [payments]);

  const filteredPayments = payments.filter((payment) => {
    if (!matchesPaymentStatus(payment, statusTab)) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      payment.id.toString().includes(searchTerm) ||
      payment.paymentMethod.toLowerCase().includes(q) ||
      payment.status.toLowerCase().includes(q)
    );
  });

  const showStaffPaging =
    isStaffListApi() && totalPayments > PAYMENTS_PAGE_SIZE && statusTab === 'all' && !searchTerm;

  if (loading && payments.length === 0) {
    return <DashboardStaffChromeSkeleton preset="adminPayments" />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Payments"
        subtitle="View and manage payment transactions"
        updatedAt={null}
        refreshing={loading && payments.length > 0}
        refreshDisabled={loading && payments.length === 0}
        onRefresh={() => void loadPayments()}
        titleVariant="large"
        titleSx={staffLargeTitleSx}
        subtitleSx={staffLargeSubtitleSx}
        showToolbarRefreshOnMobile
        containerSx={{ mb: 2 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <StaffFilterBar aria-label="Payment filters">
        <TextField
          fullWidth
          placeholder="Search by ID, method, or status…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm ? (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear payment search"
                  sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
          sx={(th) => ({
            ...sxObject(th, staffFilterFieldSx),
            width: { xs: '100%', sm: 280 },
            maxWidth: '100%',
          })}
        />
        <StaffStatusTabs
          aria-label="Payment status"
          value={statusTab}
          onChange={setStatusTab}
          options={[
            { value: 'all', label: 'All', count: statusCounts.all },
            { value: 'succeeded', label: 'Paid', count: statusCounts.succeeded },
            { value: 'pending', label: 'Pending', count: statusCounts.pending },
            { value: 'failed', label: 'Failed', count: statusCounts.failed },
          ]}
        />
      </StaffFilterBar>

      <Paper elevation={0} sx={{ ...premiumTableSurfaceSx, mb: 3, position: 'relative' }}>
        <TableSurfaceProgress active={loading && payments.length > 0} ariaLabel="Loading payments" />
        <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Payments ({filteredPayments.length}
            {showStaffPaging ? ` of ${totalPayments}` : ''})
          </Typography>
        </Box>

        {filteredPayments.length === 0 ? (
          <AppEmptyState
            sx={{ border: 0, boxShadow: 'none', borderRadius: 0 }}
            icon={<PaymentIcon />}
            title={searchTerm || statusTab !== 'all' ? 'No payments match your filters' : 'No payments yet'}
            description={
              searchTerm || statusTab !== 'all'
                ? 'Try another status tab or clear the search.'
                : 'Payment transactions will appear here once customers start charging.'
            }
          />
        ) : useGroupedList ? (
          <Box sx={{ py: 1 }}>
            <GroupedListSection>
              {filteredPayments.map((payment, index) => (
                <GroupedListRow
                  key={payment.id}
                  divider={index < filteredPayments.length - 1}
                  showChevron={false}
                  primary={formatCurrency(payment.amount, payment.currency)}
                  secondary={`#${payment.id} · ${payment.paymentMethod} · ${new Date(payment.createdAt).toLocaleDateString()}`}
                  end={
                    <AppBadge
                      label={payment.status}
                      tone={chipColorToBadgeTone(getPaymentStatusColor(payment.status))}
                      size="small"
                    />
                  }
                />
              ))}
            </GroupedListSection>
            {showStaffPaging && (
              <MobileListLoadMore
                page={page}
                totalCount={totalPayments}
                pageSize={PAYMENTS_PAGE_SIZE}
                loading={loadingMore}
                onLoadMore={() => void handleLoadMore()}
              />
            )}
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Payment</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        #{payment.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {payment.transactionId ? `Txn ${payment.transactionId}` : 'No linked transaction'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">User {payment.userId}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(payment.amount, payment.currency)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{payment.paymentMethod}</Typography>
                      {payment.paymentGateway ? (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {payment.paymentGateway}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <AppBadge
                        label={payment.status}
                        tone={chipColorToBadgeTone(getPaymentStatusColor(payment.status))}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {!useGroupedList && showStaffPaging && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Pagination
            count={Math.ceil(totalPayments / PAYMENTS_PAGE_SIZE)}
            page={page}
            onChange={(_, value) => void handleDesktopPageChange(_, value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}
