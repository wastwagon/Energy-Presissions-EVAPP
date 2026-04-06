import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  Divider,
  Chip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BoltIcon from '@mui/icons-material/Bolt';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { transactionsApi, Transaction } from '../services/transactionsApi';
import { walletApi } from '../services/walletApi';
import { getStoredUserId } from '../utils/authSession';
import { formatCurrency, formatDurationMinutes, formatEnergyKwh } from '../utils/formatters';
import { premiumPanelCardSx } from '../theme/jampackShell';
import {
  compactContainedCtaSx,
  premiumDialogPaperSx,
  premiumIconButtonTouchSx,
  sxObject,
} from '../styles/authShell';

interface TransactionSummaryDialogProps {
  open: boolean;
  onClose: () => void;
  transactionId: number;
  onRefresh?: () => void;
}

export function TransactionSummaryDialog({
  open,
  onClose,
  transactionId,
  onRefresh,
}: TransactionSummaryDialogProps) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!open || !transactionId) {
      if (!open) {
        setTransaction(null);
        setWalletBalance(null);
        setRefundAmount(0);
      }
      return;
    }

    let cancelled = false;

    const loadWalletBalance = async () => {
      try {
        const userId = getStoredUserId();
        if (!userId) return;
        const balance = await walletApi.getAvailableBalance(userId);
        if (!cancelled) {
          setWalletBalance(balance.available);
        }
      } catch (err) {
        console.error('Failed to load wallet balance:', err);
      }
    };

    const loadTransaction = async () => {
      setLoading(true);
      setTransaction(null);
      try {
        const data = await transactionsApi.getById(transactionId);
        if (cancelled) return;
        setTransaction(data);
        if (data.walletReservedAmount && data.totalCost) {
          const refund = data.walletReservedAmount - data.totalCost;
          setRefundAmount(Math.max(0, refund));
        } else {
          setRefundAmount(0);
        }
        onRefreshRef.current?.();
      } catch (err: any) {
        console.error('Failed to load transaction:', err);
        if (!cancelled) {
          setTransaction(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadWalletBalance();
    loadTransaction();

    return () => {
      cancelled = true;
    };
  }, [open, transactionId]);

  if (!open) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
    >
      <DialogTitle sx={{ pr: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            {!loading && transaction && <CheckCircleIcon color="success" sx={{ flexShrink: 0 }} />}
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
              {loading ? 'Loading session…' : 'Charging session complete'}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            aria-label="Close transaction summary dialog"
            sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading || !transaction ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 220, py: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Transaction #{transaction.transactionId}
              </Typography>
              <Typography variant="body2">
                Status: <strong>{transaction.status}</strong>
              </Typography>
            </Paper>

            <Grid container spacing={{ xs: 2, sm: 2 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BoltIcon color="primary" />
                  Charging details
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={premiumPanelCardSx}>
                  <Typography variant="body2" color="text.secondary">
                    Energy delivered
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    {formatEnergyKwh(transaction.totalEnergyKwh)} kWh
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={premiumPanelCardSx}>
                  <Typography variant="body2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {transaction.durationMinutes ? formatDurationMinutes(transaction.durationMinutes) : 'N/A'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptIcon color="primary" />
                  Billing summary
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={premiumPanelCardSx}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Charge point:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {transaction.chargePointId}
                    </Typography>
                  </Box>
                  {transaction.startTime && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Start time:
                      </Typography>
                      <Typography variant="body2">{new Date(transaction.startTime).toLocaleString()}</Typography>
                    </Box>
                  )}
                  {transaction.stopTime && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        End time:
                      </Typography>
                      <Typography variant="body2">{new Date(transaction.stopTime).toLocaleString()}</Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  {transaction.walletReservedAmount && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Amount reserved:
                      </Typography>
                      <Typography variant="body2">
                        {formatCurrency(transaction.walletReservedAmount, transaction.currency || 'GHS')}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" fontWeight="bold">
                      Total cost:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      {formatCurrency(transaction.totalCost, transaction.currency || 'GHS')}
                    </Typography>
                  </Box>
                  {refundAmount > 0 && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mt: 1,
                        p: 1,
                        bgcolor: 'success.light',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        Refunded to wallet:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="success.dark">
                        {formatCurrency(refundAmount, transaction.currency || 'GHS')}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {walletBalance !== null && (
                <Grid item xs={12}>
                  <Paper sx={{ ...premiumPanelCardSx, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccountBalanceWalletIcon />
                        <Typography variant="body1" fontWeight="bold">
                          Updated wallet balance:
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="bold">
                        {formatCurrency(walletBalance, 'GHS')}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={onClose} variant="contained" disableElevation sx={(th) => sxObject(th, compactContainedCtaSx)}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
