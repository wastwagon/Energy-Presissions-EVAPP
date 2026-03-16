import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { transactionsApi, Transaction } from '../../services/transactionsApi';
import PaymentIcon from '@mui/icons-material/Payment';
import { PaystackPayment } from '../../components/PaystackPayment';

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
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (tx.userId !== user.id) {
          setError('Transaction not found');
          return;
        }
      }
      setTransaction(tx);
    } catch (err: any) {
      setError(err.message || 'Failed to load transaction');
      console.error('Error loading transaction:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    // Always use GHS for Ghana operations
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
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
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/user/sessions/history')}>
          Back to History
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/user/sessions/history')}>
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Transaction Details
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Transaction ID: {transaction.transactionId}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Charging Session Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Charge Point
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {transaction.chargePointId}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Connector
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {transaction.connectorId}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={transaction.status}
                  color={
                    transaction.status === 'Completed'
                      ? 'success'
                      : transaction.status === 'Active'
                      ? 'info'
                      : 'default'
                  }
                  size="small"
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Energy Consumed
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {transaction.totalEnergyKwh !== undefined && transaction.totalEnergyKwh !== null
                    ? (typeof transaction.totalEnergyKwh === 'number' 
                        ? transaction.totalEnergyKwh.toFixed(2)
                        : parseFloat(String(transaction.totalEnergyKwh)).toFixed(2))
                    : '-'} kWh
                </Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formatDuration(transaction.durationMinutes)}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="body2" color="text.secondary">
                  Start Time
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {new Date(transaction.startTime).toLocaleString()}
                </Typography>
              </Grid>
              {transaction.stopTime && (
                <Grid item xs={6} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    End Time
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {new Date(transaction.stopTime).toLocaleString()}
                  </Typography>
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Box>
              <Typography variant="h6" gutterBottom>
                Total Cost
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
                {formatCurrency(transaction.totalCost)}
              </Typography>
              {transaction.status === 'Completed' && transaction.totalCost && (
                <Button
                  variant="contained"
                  startIcon={<PaymentIcon />}
                  onClick={() => setPaymentDialogOpen(true)}
                  size="large"
                  sx={{ minWidth: 200 }}
                >
                  Pay Now
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                sx={{ mb: 1 }}
                onClick={() => navigate(`/stations/${transaction.chargePointId}`)}
              >
                View Charge Point
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/user/sessions/history')}
              >
                Back to History
              </Button>
            </CardContent>
          </Card>
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

