import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaymentIcon from '@mui/icons-material/Payment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { useOpsBasePath } from '../../hooks/useOpsBasePath';
import { transactionsApi, Transaction, MeterSample } from '../../services/transactionsApi';
import { PaystackPayment } from '../../components/PaystackPayment';
import { paymentsApi } from '../../services/paymentsApi';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { dashboardPageTitleSx, dashboardPageSubtitleSx } from '../../theme/jampackShell';
import { requireStoredUserId } from '../../utils/authSession';
import { formatCurrency, formatDurationMinutes, formatEnergyKwh } from '../../utils/formatters';
import { getTransactionStatusColor } from '../../utils/statusColors';

export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const opsBase = useOpsBasePath();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [meterValues, setMeterValues] = useState<MeterSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [cashPaymentDialogOpen, setCashPaymentDialogOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [cashNotes, setCashNotes] = useState<string>('');
  const [processingCash, setProcessingCash] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setError(null);
      const [tx, meterVals] = await Promise.all([
        transactionsApi.getById(parseInt(id)),
        transactionsApi.getMeterValues(parseInt(id)).catch(() => []),
      ]);
      setTransaction(tx);
      setMeterValues(meterVals);
    } catch (err: any) {
      setError(err.message || 'Failed to load transaction details');
      console.error('Error loading transaction details:', err);
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

  if (!transaction) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`${opsBase}/sessions`)} sx={{ mb: 2 }}>
          Back to Sessions
        </Button>
        <Alert severity="error">Transaction not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`${opsBase}/sessions`)}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          Back
        </Button>
        <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
          <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
            Transaction #{transaction.transactionId}
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            Session timeline, meter samples, and payment handling.
          </Typography>
        </Box>
        <Chip
          label={transaction.status}
          color={getTransactionStatusColor(transaction.status)}
          sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Transaction Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transaction Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Transaction ID
                  </Typography>
                  <Typography variant="body1">{transaction.transactionId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Charge Point
                  </Typography>
                  <Typography variant="body1">{transaction.chargePointId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Connector
                  </Typography>
                  <Typography variant="body1">{transaction.connectorId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    IdTag
                  </Typography>
                  <Typography variant="body1">{transaction.idTag || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Start Time
                  </Typography>
                  <Typography variant="body1">
                    {new Date(transaction.startTime).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Stop Time
                  </Typography>
                  <Typography variant="body1">
                    {transaction.stopTime
                      ? new Date(transaction.stopTime).toLocaleString()
                      : transaction.status === 'Active'
                      ? 'In progress...'
                      : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body1">
                    {formatDurationMinutes(transaction.durationMinutes)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={transaction.status}
                    color={getTransactionStatusColor(transaction.status)}
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Energy & Cost */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Energy & Cost
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Meter Start
                  </Typography>
                  <Typography variant="body1">{transaction.meterStart} Wh</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Meter Stop
                  </Typography>
                  <Typography variant="body1">
                    {transaction.meterStop ? `${transaction.meterStop} Wh` : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Energy Consumed
                  </Typography>
                  <Typography variant="h6">
                    {`${formatEnergyKwh(transaction.totalEnergyKwh, 3)} kWh`}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Cost
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(transaction.totalCost, 'GHS')}
                  </Typography>
                  {transaction.status === 'Completed' && transaction.totalCost && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<PaymentIcon />}
                        onClick={() => setPaymentDialogOpen(true)}
                        size="medium"
                        sx={{ minWidth: 180 }}
                      >
                        Pay Now
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<AttachMoneyIcon />}
                        onClick={() => {
                          setCashAmount(transaction.totalCost || 0);
                          setCashPaymentDialogOpen(true);
                        }}
                        size="medium"
                        color="success"
                        sx={{ minWidth: 150 }}
                      >
                        Cash Payment
                      </Button>
                    </Box>
                  )}
                </Grid>
                {transaction.reason && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Stop Reason
                    </Typography>
                    <Typography variant="body1">{transaction.reason}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Meter Values */}
        {meterValues.length > 0 && (
          <Grid item xs={12}>
            <Paper>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Meter Values</Typography>
              </Box>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Measurand</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Phase</TableCell>
                      <TableCell>Value</TableCell>
                      <TableCell>Unit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {meterValues.map((sample, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(sample.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>{sample.measurand || '-'}</TableCell>
                        <TableCell>{sample.location || '-'}</TableCell>
                        <TableCell>{sample.phase || '-'}</TableCell>
                        <TableCell>{sample.value}</TableCell>
                        <TableCell>{sample.unit || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Paystack Payment Dialog */}
      <PaystackPayment
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        transactionId={transaction.transactionId}
        amount={transaction.totalCost || 0}
        currency={transaction.currency}
        userId={transaction.userId || undefined}
        onSuccess={() => {
          setPaymentDialogOpen(false);
          loadData(); // Reload to show updated payment status
        }}
        onError={(error) => {
          setError(error);
        }}
      />

      {/* Cash Payment Dialog */}
      <Dialog open={cashPaymentDialogOpen} onClose={() => setCashPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Cash Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Amount Received"
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
              margin="normal"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>GHS</Typography>,
              }}
              helperText={`Transaction total: ${formatCurrency(transaction.totalCost ?? 0, 'GHS')}`}
            />
            <TextField
              fullWidth
              label="Notes (optional)"
              multiline
              rows={3}
              value={cashNotes}
              onChange={(e) => setCashNotes(e.target.value)}
              margin="normal"
              placeholder="Additional notes about this cash payment..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCashPaymentDialogOpen(false)} disabled={processingCash}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              try {
                setProcessingCash(true);
                setError(null);
                
                const userId = requireStoredUserId();
                
                await paymentsApi.processCashPayment(
                  transaction.transactionId,
                  cashAmount,
                  userId,
                  cashNotes,
                );
                
                setCashPaymentDialogOpen(false);
                setCashAmount(0);
                setCashNotes('');
                loadData(); // Reload to show updated payment status
              } catch (err: any) {
                setError(err.response?.data?.message || err.message || 'Failed to process cash payment');
              } finally {
                setProcessingCash(false);
              }
            }}
            variant="contained"
            color="success"
            disabled={processingCash || cashAmount <= 0}
            startIcon={<AttachMoneyIcon />}
          >
            {processingCash ? 'Processing...' : 'Process Cash Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

