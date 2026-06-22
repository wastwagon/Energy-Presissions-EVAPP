import { useState, useEffect } from 'react';
import {
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
import { formatCurrency } from '../utils/formatters';
import { authFormFieldSx, compactContainedCtaSx, compactOutlinedCtaSx, sxObject } from '../styles/authShell';
import { AdaptiveSheet } from './ios/AdaptiveSheet';
import { UserErrorAlert } from './UserErrorAlert';
import { triggerHaptic } from '../utils/haptics';
import { formatUserFacingErrorMessage, UserMessages } from '../utils/userFriendlyErrors';

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
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'wallet'>('paystack');
  const [paymentChannel, setPaymentChannel] = useState<'card' | 'mobile_money' | 'bank' | 'ussd' | 'qr'>('card');
  const [mobileMoneyPhone, setMobileMoneyPhone] = useState('');
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState<'MTN' | 'Vodafone' | 'AirtelTigo'>('MTN');
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    if (open && userId) {
      void loadWalletBalance();
    }
  }, [open, userId]);

  const loadWalletBalance = async () => {
    if (!userId) return;
    setLoadingBalance(true);
    try {
      const balance = await walletApi.getBalance(userId);
      setWalletBalance(balance);
    } catch (err: unknown) {
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
      setError(UserMessages.notSignedIn);
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

      triggerHaptic('success');
      onSuccess?.();
    } catch (err: unknown) {
      const errorMessage = formatUserFacingErrorMessage(err, 'payments');
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackPayment = async () => {
    if (!email) {
      setError('Enter your email address to continue.');
      return;
    }

    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    if (paymentChannel === 'mobile_money') {
      if (!mobileMoneyPhone.trim()) {
        setError('Enter the mobile money number linked to your wallet.');
        return;
      }
      const phoneRegex = /^(\+233|0)[0-9]{9}$/;
      const cleanPhone = mobileMoneyPhone.replace(/\s+/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        setError('Enter a valid Ghana mobile number (for example 024XXXXXXX or +233XXXXXXXXX).');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      let paymentData: PaymentInitResponse;
      let formattedPhone = mobileMoneyPhone;
      if (paymentChannel === 'mobile_money' && mobileMoneyPhone) {
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
        paymentData = await paymentsApi.processTransactionPayment(
          transactionId,
          email,
          paymentChannel === 'card' ? undefined : paymentChannel,
          paymentChannel === 'mobile_money' ? formattedPhone : undefined,
        );
      } else {
        throw new Error('Either invoiceId or transactionId is required');
      }

      if (paymentData.authorizationUrl) {
        triggerHaptic('light');
        window.location.href = paymentData.authorizationUrl;
      } else {
        throw new Error('Payment URL not received');
      }
    } catch (err: unknown) {
      const errorMessage = formatUserFacingErrorMessage(err, 'payments');
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const hasSufficientBalance = walletBalance && walletBalance.balance >= amount;
  const canUseWallet = userId && walletBalance !== null;

  return (
    <AdaptiveSheet
      open={open}
      onClose={onClose}
      title="Payment"
      tall
      disableClose={loading}
      maxWidth="sm"
      actions={
        <>
          <Button onClick={onClose} disabled={loading} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            variant="contained"
            disableElevation
            disabled={
              loading ||
              (paymentMethod === 'paystack' && (!email || (paymentChannel === 'mobile_money' && !mobileMoneyPhone))) ||
              (paymentMethod === 'wallet' && !hasSufficientBalance)
            }
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={(th) => sxObject(th, compactContainedCtaSx)}
          >
            {loading
              ? 'Processing…'
              : paymentMethod === 'wallet'
                ? 'Pay with wallet'
                : paymentChannel === 'mobile_money'
                  ? `Pay with ${mobileMoneyProvider}`
                  : 'Proceed to payment'}
          </Button>
        </>
      }
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Amount to pay
        </Typography>
        <Typography variant="h5" color="primary" fontWeight="bold">
          {formatCurrency(amount, currency)}
        </Typography>
      </Box>

      {error && (
        <UserErrorAlert error={error} context="payments" sx={{ mb: 2 }} onClose={() => setError(null)} />
      )}

      {canUseWallet && (
        <>
          <Tabs
            value={paymentMethod}
            onChange={(_, newValue) => setPaymentMethod(newValue)}
            variant="fullWidth"
            sx={{ mb: 2, minHeight: 44 }}
          >
            <Tab label="Paystack" value="paystack" sx={{ minHeight: 44 }} />
            <Tab label="Wallet" value="wallet" sx={{ minHeight: 44 }} />
          </Tabs>

          {paymentMethod === 'wallet' && (
            <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                Wallet balance
              </Typography>
              <Typography variant="h6" color={hasSufficientBalance ? 'success.main' : 'error.main'}>
                {loadingBalance ? 'Loading…' : formatCurrency(walletBalance?.balance || 0, currency)}
              </Typography>
              {!hasSufficientBalance && walletBalance && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  You need {formatCurrency(amount - walletBalance.balance, currency)} more.
                </Alert>
              )}
            </Box>
          )}
        </>
      )}

      {paymentMethod === 'paystack' && (
        <>
          <TextField
            label="Email address"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            required
            disabled={loading}
            sx={(th) => sxObject(th, authFormFieldSx)}
          />

          <FormControl fullWidth margin="normal" sx={(th) => sxObject(th, authFormFieldSx)}>
            <InputLabel>Payment method</InputLabel>
            <Select
              value={paymentChannel}
              label="Payment method"
              onChange={(e) => setPaymentChannel(e.target.value as typeof paymentChannel)}
              disabled={loading}
            >
              <MenuItem value="card">Card (Visa, Mastercard)</MenuItem>
              <MenuItem value="mobile_money">Mobile money</MenuItem>
              <MenuItem value="bank">Bank transfer</MenuItem>
              <MenuItem value="ussd">USSD</MenuItem>
              <MenuItem value="qr">QR code</MenuItem>
            </Select>
            <FormHelperText>Secure checkout via Paystack</FormHelperText>
          </FormControl>

          {paymentChannel === 'mobile_money' && (
            <>
              <FormControl fullWidth margin="normal" sx={(th) => sxObject(th, authFormFieldSx)}>
                <InputLabel>Provider</InputLabel>
                <Select
                  value={mobileMoneyProvider}
                  label="Provider"
                  onChange={(e) => setMobileMoneyProvider(e.target.value as typeof mobileMoneyProvider)}
                  disabled={loading}
                >
                  <MenuItem value="MTN">MTN</MenuItem>
                  <MenuItem value="Vodafone">Vodafone</MenuItem>
                  <MenuItem value="AirtelTigo">AirtelTigo</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Mobile money number"
                type="tel"
                fullWidth
                margin="normal"
                value={mobileMoneyPhone}
                onChange={(e) => setMobileMoneyPhone(e.target.value)}
                placeholder="0XXXXXXXXX"
                required
                disabled={loading}
                sx={(th) => sxObject(th, authFormFieldSx)}
              />
            </>
          )}
        </>
      )}

      {paymentMethod === 'wallet' && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Payment will be deducted from your wallet balance.
        </Typography>
      )}
    </AdaptiveSheet>
  );
}
