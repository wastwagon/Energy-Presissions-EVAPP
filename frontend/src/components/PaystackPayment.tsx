import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import { paymentsApi, PaymentInitResponse } from '../services/paymentsApi';
import { walletApi, WalletBalance } from '../services/walletApi';

interface PaystackPaymentProps {
  open: boolean;
  onClose: () => void;
  invoiceId?: number;
  transactionId?: number;
  amount: number;
  currency?: string;
  userId?: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function PaystackPayment({
  open,
  onClose,
  invoiceId,
  transactionId,
  amount,
  currency = 'GHS',
  userId,
  onSuccess,
  onError,
}: PaystackPaymentProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'wallet'>('paystack');
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    if (open) {
      loadPublicKey();
      if (userId) {
        loadWalletBalance();
      }
    }
  }, [open, userId]);

  const loadPublicKey = async () => {
    try {
      const { publicKey: key } = await paymentsApi.getPublicKey();
      setPublicKey(key);
    } catch (err: any) {
      console.error('Error loading Paystack public key:', err);
    }
  };

  const loadWalletBalance = async () => {
    if (!userId) return;
    setLoadingBalance(true);
    try {
      const balance = await walletApi.getBalance(userId);
      setWalletBalance(balance);
    } catch (err: any) {
      console.error('Error loading wallet balance:', err);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handlePayment = async () => {
    if (paymentMethod === 'wallet') {
      await handleWalletPayment();
    } else {
      await handlePaystackPayment();
    }
  };

  const handleWalletPayment = async () => {
    if (!userId) {
      setError('User ID is required for wallet payment');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (invoiceId) {
        await walletApi.payWithWallet(invoiceId, userId);
      } else if (transactionId) {
        await walletApi.payTransactionWithWallet(transactionId, userId);
      } else {
        throw new Error('Either invoiceId or transactionId is required');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to process wallet payment';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackPayment = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let paymentData: PaymentInitResponse;

      if (invoiceId) {
        paymentData = await paymentsApi.initializePayment(invoiceId, email);
      } else if (transactionId) {
        // For transactions, we need to get the invoice first or use a different endpoint
        // For now, use initializePayment with a placeholder - this may need backend support
        throw new Error('Transaction payment initialization not yet supported. Please use invoice payment.');
      } else {
        throw new Error('Either invoiceId or transactionId is required');
      }

      // Redirect to Paystack payment page
      if (paymentData.authorizationUrl) {
        window.location.href = paymentData.authorizationUrl;
      } else {
        throw new Error('Payment URL not received');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to initialize payment';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, curr: string = 'GHS') => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: curr,
    }).format(amount);
  };

  const hasSufficientBalance = walletBalance && walletBalance.balance >= amount;
  const canUseWallet = userId && walletBalance !== null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Payment</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Amount to pay:
          </Typography>
          <Typography variant="h5" color="primary" fontWeight="bold">
            {formatCurrency(amount, currency)}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {canUseWallet && (
          <>
            <Tabs
              value={paymentMethod}
              onChange={(_, newValue) => setPaymentMethod(newValue)}
              sx={{ mb: 2 }}
            >
              <Tab label="Paystack" value="paystack" />
              <Tab label="Wallet" value="wallet" />
            </Tabs>

            {paymentMethod === 'wallet' && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Wallet Balance:
                </Typography>
                <Typography variant="h6" color={hasSufficientBalance ? 'success.main' : 'error.main'}>
                  {loadingBalance ? 'Loading...' : formatCurrency(walletBalance?.balance || 0, currency)}
                </Typography>
                {!hasSufficientBalance && walletBalance && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Insufficient balance. You need {formatCurrency(amount - walletBalance.balance, currency)} more.
                  </Alert>
                )}
              </Box>
            )}
          </>
        )}

        {paymentMethod === 'paystack' && (
          <>
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              disabled={loading}
            />

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              You will be redirected to Paystack to complete your payment securely.
            </Typography>
          </>
        )}

        {paymentMethod === 'wallet' && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Payment will be deducted from your wallet balance.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handlePayment}
          variant="contained"
          disabled={
            loading ||
            (paymentMethod === 'paystack' && !email) ||
            (paymentMethod === 'wallet' && !hasSufficientBalance)
          }
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading
            ? 'Processing...'
            : paymentMethod === 'wallet'
            ? 'Pay with Wallet'
            : 'Proceed to Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

