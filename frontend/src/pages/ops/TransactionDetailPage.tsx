import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaymentIcon from '@mui/icons-material/Payment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { useOpsBasePath } from '../../hooks/useOpsBasePath';
import { transactionsApi, Transaction, MeterSample } from '../../services/transactionsApi';
import { PaystackPayment } from '../../components/PaystackPayment';
import { paymentsApi } from '../../services/paymentsApi';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumPanelCardSx, premiumTableSurfaceSx } from '../../theme/jampackShell';
import {
  authFormFieldSx,
  compactContainedCtaSx,
  compactOutlinedCtaSx,
  compactSuccessContainedCtaSx,
  premiumDialogPaperSx,
  sxObject,
} from '../../styles/authShell';
import { requireStoredUserId } from '../../utils/authSession';
import { formatCurrency } from '../../utils/formatters';
import {
  formatCustomerDisplayName,
  formatSessionCost,
  formatSessionDuration,
  formatSessionEnergy,
  formatSessionReserved,
  sessionStatusChipColor,
  sessionStatusLabel,
} from '../../utils/sessionDisplay';
import { billingApi } from '../../services/billingApi';
import { getStoredUser } from '../../utils/authSession';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedDetailRow } from '../../components/ios/GroupedDetailRow';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { OpsLiveDetailSkeleton } from '../../components/dashboard/RouteDetailSkeleton';

export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const opsBase = useOpsBasePath();
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));
  const isSuperAdmin = getStoredUser()?.accountType === 'SuperAdmin';
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [meterValues, setMeterValues] = useState<MeterSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [cashPaymentDialogOpen, setCashPaymentDialogOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [cashNotes, setCashNotes] = useState<string>('');
  const [processingCash, setProcessingCash] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [invoiceNotice, setInvoiceNotice] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async (silent?: boolean) => {
    if (!id) return;
    const isQuiet = silent === true;
    try {
      if (isQuiet) setRefreshing(true);
      setError(null);
      const [tx, meterVals] = await Promise.all([
        transactionsApi.getById(parseInt(id)),
        transactionsApi.getMeterValues(parseInt(id)).catch(() => []),
      ]);
      setTransaction(tx);
      setMeterValues(meterVals);
      setUpdatedAt(Date.now());
    } catch (err: any) {
      setError(err.message || 'Failed to load transaction details');
      console.error('Error loading transaction details:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return <OpsLiveDetailSkeleton ariaLabel="Loading transaction details" />;
  }

  if (!transaction) {
    return (
      <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`${opsBase}/sessions`)} sx={{ mb: 2 }}>
          Back to Sessions
        </Button>
        <Alert severity="error">Transaction not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title={`Transaction #${transaction.transactionId}`}
        subtitle="Session timeline, meter samples, and payment handling"
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.transaction}
        showSeconds
        refreshing={refreshing}
        onRefresh={() => void loadData(true)}
        titleSx={dashboardPageTitleSx}
        subtitleSx={dashboardPageSubtitleSx}
        containerSx={{ mb: 2 }}
        refreshSx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: { xs: '100%', sm: 'auto' } })}
        actions={
          <>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(`${opsBase}/sessions`)}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Back
            </Button>
            <Chip
              label={sessionStatusLabel(transaction)}
              color={sessionStatusChipColor(sessionStatusLabel(transaction))}
              sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
            />
          </>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {invoiceNotice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setInvoiceNotice(null)}>
          {invoiceNotice}
        </Alert>
      )}

      {isCompact ? (
        <>
          <GroupedListSection title="Session">
            <GroupedDetailRow label="Customer" value={formatCustomerDisplayName(transaction)} divider />
            <GroupedDetailRow label="Charge point" value={transaction.chargePointId} divider />
            <GroupedDetailRow label="Connector" value={transaction.connectorId} divider />
            <GroupedDetailRow label="IdTag" value={transaction.idTag || '—'} divider />
            <GroupedDetailRow
              label="Start"
              value={new Date(transaction.startTime).toLocaleString()}
              divider={Boolean(transaction.stopTime)}
            />
            {transaction.stopTime && (
              <GroupedDetailRow label="End" value={new Date(transaction.stopTime).toLocaleString()} />
            )}
          </GroupedListSection>
          <GroupedListSection title="Energy & billing">
            <GroupedDetailRow label="Energy" value={formatSessionEnergy(transaction)} divider />
            <GroupedDetailRow label="Duration" value={formatSessionDuration(transaction)} divider />
            {transaction.status === 'Active' && (
              <GroupedDetailRow label="Purchased (max)" value={formatSessionReserved(transaction)} divider />
            )}
            <GroupedDetailRow
              label="Cost"
              value={
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {formatSessionCost(transaction)}
                </Typography>
              }
            />
          </GroupedListSection>
          {transaction.status === 'Completed' && Number(transaction.totalCost) > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              <Button
                variant="contained"
                disableElevation
                startIcon={<PaymentIcon />}
                onClick={() => setPaymentDialogOpen(true)}
                sx={(th) => ({
                  ...sxObject(th, compactContainedCtaSx),
                  width: '100%',
                })}
              >
                Pay now
              </Button>
              <Button
                variant="outlined"
                startIcon={<AttachMoneyIcon />}
                onClick={() => {
                  setCashAmount(transaction.totalCost || 0);
                  setCashPaymentDialogOpen(true);
                }}
                sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: '100%' })}
              >
                Cash payment
              </Button>
              {isSuperAdmin && (
                <Button
                  variant="outlined"
                  disabled={generatingInvoice}
                  onClick={async () => {
                    setGeneratingInvoice(true);
                    try {
                      const inv = await billingApi.generateInvoice(transaction.transactionId);
                      setInvoiceNotice(`Invoice ${inv.invoiceNumber} generated`);
                    } catch (err: unknown) {
                      setError(err instanceof Error ? err.message : 'Failed to generate invoice');
                    } finally {
                      setGeneratingInvoice(false);
                    }
                  }}
                  sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: '100%' })}
                >
                  {generatingInvoice ? 'Generating…' : 'Generate invoice'}
                </Button>
              )}
            </Box>
          )}
        </>
      ) : (
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Transaction Info */}
        <Grid item xs={12} md={6}>
          <Paper sx={premiumPanelCardSx}>
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
                    Customer
                  </Typography>
                  <Typography variant="body1">{formatCustomerDisplayName(transaction)}</Typography>
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
                  <Typography variant="body1">{formatSessionDuration(transaction)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={sessionStatusLabel(transaction)}
                    color={sessionStatusChipColor(sessionStatusLabel(transaction))}
                    size="small"
                  />
                </Grid>
              </Grid>
          </Paper>
        </Grid>

        {/* Energy & Cost */}
        <Grid item xs={12} md={6}>
          <Paper sx={premiumPanelCardSx}>
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
                    {formatSessionEnergy(transaction)}
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
                        disableElevation
                        startIcon={<PaymentIcon />}
                        onClick={() => setPaymentDialogOpen(true)}
                        sx={(th) => ({
                          ...sxObject(th, compactContainedCtaSx),
                          minWidth: { xs: '100%', sm: 180 },
                          width: { xs: '100%', sm: 'auto' },
                        })}
                      >
                        Pay Now
                      </Button>
                      <Button
                        variant="outlined"
                        color="success"
                        startIcon={<AttachMoneyIcon />}
                        onClick={() => {
                          setCashAmount(transaction.totalCost || 0);
                          setCashPaymentDialogOpen(true);
                        }}
                        sx={(th) => ({
                          ...sxObject(th, compactOutlinedCtaSx),
                          borderColor: alpha(th.palette.success.main, 0.45),
                          color: 'success.main',
                          minWidth: { xs: '100%', sm: 150 },
                          width: { xs: '100%', sm: 'auto' },
                          '&:hover': {
                            borderWidth: 1,
                            borderColor: 'success.main',
                            bgcolor: alpha(th.palette.success.main, 0.06),
                            boxShadow: 'none',
                          },
                        })}
                      >
                        Cash Payment
                      </Button>
                      {isSuperAdmin && (
                        <Button
                          variant="outlined"
                          disabled={generatingInvoice}
                          onClick={async () => {
                            setGeneratingInvoice(true);
                            try {
                              const inv = await billingApi.generateInvoice(transaction.transactionId);
                              setInvoiceNotice(`Invoice ${inv.invoiceNumber} generated`);
                            } catch (err: unknown) {
                              setError(err instanceof Error ? err.message : 'Failed to generate invoice');
                            } finally {
                              setGeneratingInvoice(false);
                            }
                          }}
                          sx={(th) => ({
                            ...sxObject(th, compactOutlinedCtaSx),
                            minWidth: { xs: '100%', sm: 160 },
                            width: { xs: '100%', sm: 'auto' },
                          })}
                        >
                          {generatingInvoice ? 'Generating…' : 'Generate invoice'}
                        </Button>
                      )}
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
          </Paper>
        </Grid>

      </Grid>
      )}

      {meterValues.length > 0 && (
        <Paper sx={{ ...premiumTableSurfaceSx, mt: 2 }}>
          <Box sx={{ p: { xs: 1.5, sm: 2 }, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              Meter Values
            </Typography>
          </Box>
          <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table stickyHeader size="small">
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
                    <TableCell>{new Date(sample.timestamp).toLocaleString()}</TableCell>
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
      )}

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
          loadData(true); // Reload to show updated payment status
        }}
        onError={(error) => {
          setError(error);
        }}
      />

      {/* Cash Payment Dialog */}
      <Dialog
        open={cashPaymentDialogOpen}
        onClose={() => setCashPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Process Cash Payment</DialogTitle>
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
              sx={(th) => sxObject(th, authFormFieldSx)}
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
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button
            onClick={() => setCashPaymentDialogOpen(false)}
            disabled={processingCash}
            sx={(th) => sxObject(th, compactOutlinedCtaSx)}
          >
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
                loadData(true); // Reload to show updated payment status
              } catch (err: any) {
                setError(err.response?.data?.message || err.message || 'Failed to process cash payment');
              } finally {
                setProcessingCash(false);
              }
            }}
            variant="contained"
            disableElevation
            disabled={processingCash || cashAmount <= 0}
            startIcon={<AttachMoneyIcon />}
            sx={(th) => sxObject(th, compactSuccessContainedCtaSx)}
          >
            {processingCash ? 'Processing...' : 'Process Cash Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

