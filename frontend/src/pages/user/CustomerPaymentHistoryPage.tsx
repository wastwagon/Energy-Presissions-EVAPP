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
  Pagination,
} from '@mui/material';
import { paymentsApi, Payment } from '../../services/paymentsApi';
import PaymentIcon from '@mui/icons-material/Payment';
import { CustomerQuickActions } from '../../components/dashboard/CustomerQuickActions';
import {
  dashboardPageTitleSx,
  dashboardPageSubtitleSx,
  premiumEmptyStatePaperSx,
  premiumTableSurfaceSx,
} from '../../theme/jampackShell';
import { formatCurrency } from '../../utils/formatters';
import { getPaymentStatusColor } from '../../utils/statusColors';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { CustomerChromeSkeleton } from '../../components/dashboard/CustomerChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';

export function CustomerPaymentHistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const { loading, refreshing, updatedAt, runWithRefresh } = useLiveRefresh();
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const limit = 20;

  const loadPayments = useCallback(async (silent?: boolean) => {
    await runWithRefresh(async () => {
      try {
        setError(null);
        const response = await paymentsApi.getUserPayments(limit, (page - 1) * limit);
        const paymentsList = Array.isArray(response) ? response : response.payments || [];
        const total = Array.isArray(response) ? paymentsList.length : response.total || paymentsList.length;
        setPayments(paymentsList);
        setTotalPayments(total);
        return true;
      } catch (err: any) {
        setError(err.message || 'Failed to load payment history');
        console.error('Error loading payments:', err);
        return false;
      }
    }, silent);
  }, [page, runWithRefresh]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

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
        titleSx={dashboardPageTitleSx}
        subtitleSx={dashboardPageSubtitleSx}
      />

      <CustomerQuickActions preset="payments" />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {payments.length === 0 ? (
        <Paper elevation={0} sx={premiumEmptyStatePaperSx}>
          <Box
            sx={(theme) => ({
              width: 72,
              height: 72,
              mx: 'auto',
              mb: 2,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: theme.palette.action.hover,
              color: 'text.secondary',
            })}
          >
            <PaymentIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            No payment history
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You have not made any payments yet.
          </Typography>
        </Paper>
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

