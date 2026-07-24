import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Pagination,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { MobileListLoadMore } from '../../components/ios/MobileListLoadMore';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { useCustomerPullRefresh } from '../../contexts/CustomerPullRefreshContext';
import { paymentsApi, Payment } from '../../services/paymentsApi';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';
import { formatCurrency } from '../../utils/formatters';
import { CUSTOMER_ROUTES } from '../../config/customerNav.paths';
import { triggerHaptic } from '../../utils/haptics';
import { getPaymentStatusColor } from '../../utils/statusColors';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { CustomerChromeSkeleton } from '../../components/dashboard/CustomerChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';
import { UserErrorAlert } from '../../components/UserErrorAlert';
import { formatUserFacingErrorMessage } from '../../utils/userFriendlyErrors';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { AppBadge, chipColorToBadgeTone } from '../../components/ui/AppBadge';
import { CUSTOMER_IMAGES } from '../../config/customerImagery';

export function CustomerPaymentHistoryPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [payments, setPayments] = useState<Payment[]>([]);
  const { loading, refreshing, updatedAt, runWithRefresh } = useLiveRefresh();
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 20;

  const fetchPaymentsPage = useCallback(async (pageNum: number, append: boolean) => {
    const response = await paymentsApi.getUserPayments(limit, (pageNum - 1) * limit);
    const paymentsList = Array.isArray(response) ? response : response.payments || [];
    const total = Array.isArray(response) ? paymentsList.length : response.total || paymentsList.length;
    setPayments((prev) => (append ? [...prev, ...paymentsList] : paymentsList));
    setTotalPayments(total);
    setPage(pageNum);
    return true;
  }, []);

  const loadPayments = useCallback(
    async (silent?: boolean) => {
      await runWithRefresh(async () => {
        try {
          setError(null);
          return await fetchPaymentsPage(1, false);
        } catch (err: unknown) {
          setError(formatUserFacingErrorMessage(err, 'payments'));
          console.error('Error loading payments:', err);
          return false;
        }
      }, silent);
    },
    [fetchPaymentsPage, runWithRefresh],
  );

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || page * limit >= totalPayments) return;
    setLoadingMore(true);
    try {
      setError(null);
      await fetchPaymentsPage(page + 1, true);
    } catch (err: unknown) {
      setError(formatUserFacingErrorMessage(err, 'payments'));
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPaymentsPage, loadingMore, page, totalPayments, limit]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  useCustomerPullRefresh(useCallback(() => void loadPayments(true), [loadPayments]));

  if (loading && payments.length === 0) {
    return <CustomerChromeSkeleton preset="paymentHistory" />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Payment History"
        subtitle="View all your payment transactions"
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.payments}
        refreshing={refreshing}
        onRefresh={() => void loadPayments(true)}
        titleVariant="large"
      />

      {error && (
        <UserErrorAlert error={error} context="payments" sx={{ mb: 3 }} onClose={() => setError(null)} />
      )}

      {payments.length === 0 ? (
        <AppEmptyState
          illustrationSrc={CUSTOMER_IMAGES.walletEnergy}
          illustrationAlt="Wallet payments"
          title="No payments yet"
          description="Top-ups and wallet payments will list here."
          primaryAction={{
            label: 'Top up wallet',
            onClick: () => {
              triggerHaptic('light');
              navigate(CUSTOMER_ROUTES.walletTopUp);
            },
          }}
          secondaryAction={{
            label: 'View wallet',
            onClick: () => {
              triggerHaptic('light');
              navigate(CUSTOMER_ROUTES.wallet);
            },
            variant: 'secondary',
          }}
        />
      ) : useGroupedList ? (
        <>
          <TableSurfaceProgress active={loading && payments.length > 0} ariaLabel="Loading payment history" />
          <GroupedListSection title="Your payments">
            {payments.map((payment, index) => (
              <GroupedListRow
                key={payment.id}
                divider={index < payments.length - 1}
                showChevron={Boolean(payment.transactionId)}
                primary={formatCurrency(payment.amount, payment.currency)}
                secondary={`${payment.paymentMethod} · ${new Date(payment.createdAt).toLocaleDateString()}`}
                end={<AppBadge label={payment.status} tone={chipColorToBadgeTone(getPaymentStatusColor(payment.status))} />}
                onClick={
                  payment.transactionId
                    ? () => {
                        triggerHaptic('light');
                        navigate(`${CUSTOMER_ROUTES.sessionsRoot}/${payment.transactionId}`);
                      }
                    : undefined
                }
              />
            ))}
          </GroupedListSection>
          <MobileListLoadMore
            page={page}
            totalCount={totalPayments}
            pageSize={limit}
            loading={loadingMore}
            onLoadMore={() => void handleLoadMore()}
          />
        </>
      ) : (
        <>
          <Paper elevation={0} sx={{ ...premiumTableSurfaceSx, position: 'relative' }}>
            <TableSurfaceProgress active={loading && payments.length > 0} ariaLabel="Loading payment history" />
            <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Your payments
              </Typography>
            </Box>
            <TableContainer sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Payment ID</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>#{payment.id}</TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {formatCurrency(payment.amount, payment.currency)}
                      </Typography>
                    </TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell>
                      <AppBadge
                        label={payment.status}
                        tone={chipColorToBadgeTone(getPaymentStatusColor(payment.status))}
                      />
                    </TableCell>
                    <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          </Paper>
          {totalPayments > limit && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(totalPayments / limit)}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

