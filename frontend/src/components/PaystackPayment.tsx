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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
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
  const [paymentChannel, setPaymentChannel] = useState<'card' | 'mobile_money' | 'bank' | 'ussd' | 'qr'>('card');
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState('');
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState<'MTN' | 'Vodafone' | 'AirtelTigo'>('MTN');
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

    // Validate mobile money phone if mobile money selected
    if (paymentChannel === 'mobile_money') {
      if (!mobileMoneyPhone || mobileMoneyPhone.trim() === '') {
        setError('Please enter your mobile money phone number');
        return;
      }
      // Validate Ghana phone number format (+233XXXXXXXXX or 0XXXXXXXXX)
      const phoneRegex = /^(\+233|0)[0-9]{9}$/;
      const cleanPhone = mobileMoneyPhone.replace(/\s+/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        setError('Please enter a valid Ghana phone number (e.g., +233XXXXXXXXX or 0XXXXXXXXX)');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      let paymentData: PaymentInitResponse;

      // Format phone number for mobile money
      let formattedPhone = mobileMoneyPhone;
      if (paymentChannel === 'mobile_money' && mobileMoneyPhone) {
        // Convert 0XXXXXXXXX to +233XXXXXXXXX
        formattedPhone = mobileMoneyPhone.replace(/^0/, '+233').replace(/\s+/g, '');
      }

      if (invoiceId) {
        paymentData = await paymentsApi.initializePayment(
          invoiceId,
          email,
          paymentChannel === 'card' ? undefined : paymentChannel,
          paymentChannel === 'mobile_money' ? formattedPhone : undefined,
        );
      } else if (transactionId) {
        // Use processTransactionPayment which handles invoice creation automatically
        paymentData = await paymentsApi.processTransactionPayment(
          transactionId,
          email,
          paymentChannel === 'card' ? undefined : paymentChannel,
          paymentChannel === 'mobile_money' ? formattedPhone : undefined,
        );
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

            {/* Payment Channel Selection */}
            <FormControl fullWidth margin="normal">
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentChannel}
                label="Payment Method"
                onChange={(e) => setPaymentChannel(e.target.value as any)}
                disabled={loading}
              >
                <MenuItem value="card">Card (Visa, Mastercard)</MenuItem>
                <MenuItem value="mobile_money">Mobile Money (MTN, Vodafone, AirtelTigo)</MenuItem>
                <MenuItem value="bank">Bank Transfer</MenuItem>
                <MenuItem value="ussd">USSD</MenuItem>
                <MenuItem value="qr">QR Code</MenuItem>
              </Select>
              <FormHelperText>
                {paymentChannel === 'mobile_money' && 'Select your mobile money provider below'}
                {paymentChannel === 'card' && 'Pay with your debit or credit card'}
                {paymentChannel === 'bank' && 'Transfer directly from your bank account'}
                {paymentChannel === 'ussd' && 'Pay using USSD code'}
                {paymentChannel === 'qr' && 'Scan QR code to pay'}
              </FormHelperText>
            </FormControl>

            {/* Mobile Money Phone Input */}
            {paymentChannel === 'mobile_money' && (
              <>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Mobile Money Provider</InputLabel>
                  <Select
                    value={mobileMoneyProvider}
                    label="Mobile Money Provider"
                    onChange={(e) => setMobileMoneyProvider(e.target.value as any)}
                    disabled={loading}
                  >
                    <MenuItem value="MTN">MTN Mobile Money</MenuItem>
                    <MenuItem value="Vodafone">Vodafone Cash</MenuItem>
                    <MenuItem value="AirtelTigo">AirtelTigo Money</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Mobile Money Phone Number"
                  type="tel"
                  fullWidth
                  margin="normal"
                  value={mobileMoneyPhone}
                  onChange={(e) => setMobileMoneyPhone(e.target.value)}
                  placeholder="+233XXXXXXXXX or 0XXXXXXXXX"
                  required
                  disabled={loading}
                  helperText="Enter your mobile money registered phone number"
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>+233</Typography>,
                  }}
                />

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Mobile Money Payment:</strong> You will be redirected to Paystack where you can select{' '}
                    {mobileMoneyProvider} and complete your payment using your mobile money account.
                  </Typography>
                </Alert>
              </>
            )}

            {paymentChannel !== 'mobile_money' && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                You will be redirected to Paystack to complete your payment securely.
              </Typography>
            )}
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
            (paymentMethod === 'paystack' && (!email || (paymentChannel === 'mobile_money' && !mobileMoneyPhone))) ||
            (paymentMethod === 'wallet' && !hasSufficientBalance)
          }
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading
            ? 'Processing...'
            : paymentMethod === 'wallet'
            ? 'Pay with Wallet'
            : paymentChannel === 'mobile_money'
            ? `Pay with ${mobileMoneyProvider}`
            : 'Proceed to Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

