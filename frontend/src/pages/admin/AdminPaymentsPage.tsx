import { useState, useEffect, useCallback } from 'react';
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
  TextField,
  InputAdornment,
  Pagination,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PaymentIcon from '@mui/icons-material/Payment';
import { paymentsApi, Payment } from '../../services/paymentsApi';
import { getStoredAccountType } from '../../utils/authSession';
import { formatCurrency } from '../../utils/formatters';
import { getPaymentStatusColor } from '../../utils/statusColors';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';
import { staffLargeSubtitleSx, staffLargeTitleSx } from '../../theme/staffChrome';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { useStaffPullRefresh } from '../../hooks/useStaffPullRefresh';
import { staffFilterFieldSx, sxObject } from '../../styles/authShell';
import { DashboardStaffChromeSkeleton } from '../../components/dashboard/DashboardStaffChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { MobileListLoadMore } from '../../components/ios/MobileListLoadMore';

const PAYMENTS_PAGE_SIZE = 20;

export function AdminPaymentsPage() {
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredPayments = payments.filter(
    (payment) =>
      payment.id.toString().includes(searchTerm) ||
      payment.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.status.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const showStaffPaging = isStaffListApi() && totalPayments > PAYMENTS_PAGE_SIZE;

  if (loading && payments.length === 0) {
    return <DashboardStaffChromeSkeleton preset="adminPayments" />;
  }

  const emptyState = (
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <PaymentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
      <Typography variant="body2" color="text.secondary">
        {searchTerm ? 'No payments found matching your search' : 'No payments yet'}
      </Typography>
    </Box>
  );

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

      <Paper elevation={0} sx={{ ...premiumTableSurfaceSx, mb: 3, position: 'relative' }}>
        <TableSurfaceProgress active={loading && payments.length > 0} ariaLabel="Loading payments" />
        <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
            Payments
          </Typography>
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
            }}
            sx={(th) => sxObject(th, staffFilterFieldSx)}
          />
        </Box>

        {filteredPayments.length === 0 ? (
          emptyState
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
                    <Chip
                      label={payment.status}
                      color={getPaymentStatusColor(payment.status)}
                      size="small"
                      sx={{ height: 24 }}
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
                      <Chip
                        label={payment.status}
                        color={getPaymentStatusColor(payment.status)}
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
