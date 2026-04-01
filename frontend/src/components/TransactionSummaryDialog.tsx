import { useEffect, useState } from 'react';
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BoltIcon from '@mui/icons-material/Bolt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { transactionsApi, Transaction } from '../services/transactionsApi';
import { walletApi } from '../services/walletApi';
import { getStoredUserId } from '../utils/authSession';
import { formatCurrency, formatDurationMinutes, formatEnergyKwh } from '../utils/formatters';

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

  useEffect(() => {
    if (open && transactionId) {
      loadTransaction();
      loadWalletBalance();
    }
  }, [open, transactionId]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      const data = await transactionsApi.getById(transactionId);
      setTransaction(data);
      
      // Calculate refund if wallet-based transaction
      if (data.walletReservedAmount && data.totalCost) {
        const refund = data.walletReservedAmount - data.totalCost;
        setRefundAmount(Math.max(0, refund));
      }
    } catch (err: any) {
      console.error('Failed to load transaction:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const userId = getStoredUserId();
      if (!userId) return;
      const balance = await walletApi.getAvailableBalance(userId);
      setWalletBalance(balance.available);
    } catch (err) {
      console.error('Failed to load wallet balance:', err);
    }
  };

  if (!transaction) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="h6">Charging Session Complete</Typography>
          </Box>
          <IconButton onClick={onClose} size="small" aria-label="Close transaction summary dialog">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Paper sx={{ p: 3, mb: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Transaction #{transaction.transactionId}
          </Typography>
          <Typography variant="body2">
            Status: <strong>{transaction.status}</strong>
          </Typography>
        </Paper>

        <Grid container spacing={2}>
          {/* Charging Details */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BoltIcon color="primary" />
              Charging Details
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">Energy Delivered</Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {formatEnergyKwh(transaction.totalEnergyKwh)} kWh
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">Duration</Typography>
              <Typography variant="h5" fontWeight="bold">
                {transaction.durationMinutes ? formatDurationMinutes(transaction.durationMinutes) : 'N/A'}
              </Typography>
            </Paper>
          </Grid>

          {/* Billing Summary */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptIcon color="primary" />
              Billing Summary
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Charge Point:</Typography>
                <Typography variant="body2" fontWeight="medium">{transaction.chargePointId}</Typography>
              </Box>
              {transaction.startTime && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Start Time:</Typography>
                  <Typography variant="body2">{new Date(transaction.startTime).toLocaleString()}</Typography>
                </Box>
              )}
              {transaction.stopTime && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">End Time:</Typography>
                  <Typography variant="body2">{new Date(transaction.stopTime).toLocaleString()}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              {transaction.walletReservedAmount && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Amount Reserved:</Typography>
                  <Typography variant="body2">
                    {formatCurrency(transaction.walletReservedAmount, transaction.currency || 'GHS')}
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1" fontWeight="bold">Total Cost:</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {formatCurrency(transaction.totalCost, transaction.currency || 'GHS')}
                </Typography>
              </Box>
              {refundAmount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold">Refunded to Wallet:</Typography>
                  <Typography variant="body1" fontWeight="bold" color="success.dark">
                    {formatCurrency(refundAmount, transaction.currency || 'GHS')}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Updated Wallet Balance */}
          {walletBalance !== null && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalanceWalletIcon />
                    <Typography variant="body1" fontWeight="bold">
                      Updated Wallet Balance:
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
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
