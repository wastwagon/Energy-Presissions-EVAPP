import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { transactionsApi, Transaction } from '../../services/transactionsApi';
import PaymentIcon from '@mui/icons-material/Payment';
import { PaystackPayment } from '../../components/PaystackPayment';
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumPanelCardSx } from '../../theme/jampackShell';
import { compactContainedCtaSx, compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { getStoredUser } from '../../utils/authSession';
import { formatCurrency, formatDurationMinutes, formatEnergyKwh } from '../../utils/formatters';
import { getTransactionStatusColor } from '../../utils/statusColors';

export function CustomerTransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadTransaction();
    }
  }, [id]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      setError(null);
      const tx = await transactionsApi.getById(parseInt(id!));
      // Verify this transaction belongs to the current user
      const user = getStoredUser();
      if (typeof user?.id !== 'number' || tx.userId !== user.id) {
        setError('Transaction not found');
        return;
      }
      setTransaction(tx);
    } catch (err: any) {
      setError(err.message || 'Failed to load transaction');
      console.error('Error loading transaction:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !transaction) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Transaction not found'}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/user/sessions/history')}
          sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: { xs: '100%', sm: 'auto' } })}
        >
          Back to history
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/user/sessions/history')}
          sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: { xs: '100%', sm: 'auto' } })}
        >
          Back
        </Button>
        <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
          <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
            Transaction details
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            Transaction ID: {transaction.transactionId}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={premiumPanelCardSx}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3 }}>
              Charging session
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Charge point
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.25 }}>
                  {transaction.chargePointId}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Connector
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.25 }}>
                  {transaction.connectorId}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={transaction.status}
                    color={getTransactionStatusColor(transaction.status)}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Energy consumed
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.25 }}>
                  {formatEnergyKwh(transaction.totalEnergyKwh)} kWh
                </Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Duration
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.25 }}>
                  {formatDurationMinutes(transaction.durationMinutes)}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Start time
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.25 }}>
                  {new Date(transaction.startTime).toLocaleString()}
                </Typography>
              </Grid>
              {transaction.stopTime && (
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    End time
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.25 }}>
                    {new Date(transaction.stopTime).toLocaleString()}
                  </Typography>
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box
              sx={(theme) => ({
                mt: 2,
                p: { xs: 2, sm: 2.25 },
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
                  theme.palette.primary.main,
                  0.02
                )} 100%)`,
              })}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Total cost
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', my: 1 }}>
                {formatCurrency(transaction.totalCost, 'GHS')}
              </Typography>
              {transaction.status === 'Completed' && transaction.totalCost && (
                <Button
                  variant="contained"
                  disableElevation
                  startIcon={<PaymentIcon />}
                  onClick={() => setPaymentDialogOpen(true)}
                  sx={(th) => ({
                    ...sxObject(th, compactContainedCtaSx),
                    width: { xs: '100%', sm: 'auto' },
                    minWidth: { sm: 200 },
                  })}
                >
                  Pay now
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={premiumPanelCardSx}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Quick actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate(`/stations/${transaction.chargePointId}`)}
                sx={(th) => sxObject(th, compactOutlinedCtaSx)}
              >
                View charge point
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/user/sessions/history')}
                sx={(th) => sxObject(th, compactOutlinedCtaSx)}
              >
                Back to history
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {paymentDialogOpen && transaction && (
        <PaystackPayment
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          transactionId={transaction.transactionId}
          amount={transaction.totalCost || 0}
          currency={transaction.currency}
          onSuccess={() => {
            setPaymentDialogOpen(false);
            loadTransaction();
          }}
          onError={(err) => setError(err)}
        />
      )}
    </Box>
  );
}

