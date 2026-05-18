import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  InputAdornment,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { walletApi, WalletBalance } from '../../services/walletApi';
import { PaystackPayment } from '../../components/PaystackPayment';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { premiumPanelCardSx } from '../../theme/jampackShell';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { useCustomerPullRefresh } from '../../contexts/CustomerPullRefreshContext';
import { triggerHaptic } from '../../utils/haptics';
import {
  authFormFieldSx,
  compactContainedCtaSx,
  compactOutlinedCtaSx,
  sxObject,
} from '../../styles/authShell';
import { alpha } from '@mui/material/styles';
import { getStoredUser } from '../../utils/authSession';
import { CUSTOMER_ROUTES } from '../../config/customerNav.paths';
import { formatCurrency } from '../../utils/formatters';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { CustomerChromeSkeleton } from '../../components/dashboard/CustomerChromeSkeleton';

export function CustomerTopUpPage() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [amount, setAmount] = useState<string>('');
  const { loading, refreshing, updatedAt, runWithRefresh } = useLiveRefresh();
  const [error, setError] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [quickAmount, setQuickAmount] = useState<number | null>(null);

  const loadBalance = useCallback(async (silent?: boolean) => {
    await runWithRefresh(async () => {
      try {
        setError(null);
        const user = getStoredUser();
        if (typeof user?.id !== 'number') {
          setError('User not logged in');
          return false;
        }
        const balanceData = await walletApi.getBalance(user.id);
        setBalance(balanceData);
        return true;
      } catch (err: any) {
        setError(err.message || 'Failed to load wallet balance');
        console.error('Error loading balance:', err);
        return false;
      }
    }, silent);
  }, [runWithRefresh]);

  useEffect(() => {
    void loadBalance();
  }, [loadBalance]);

  useCustomerPullRefresh(useCallback(() => void loadBalance(true), [loadBalance]));

  const handleQuickAmount = (value: number) => {
    triggerHaptic('light');
    setQuickAmount(value);
    setAmount(value.toString());
  };

  const handleTopUp = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (numAmount < 1) {
      setError('Minimum top-up amount is GHS 1.00');
      return;
    }
    setError(null);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    triggerHaptic('success');
    setPaymentDialogOpen(false);
    void loadBalance(true);
    navigate(CUSTOMER_ROUTES.wallet);
  };

  const user = getStoredUser();
  const userId = typeof user?.id === 'number' ? user.id : undefined;

  if (loading) {
    return <CustomerChromeSkeleton preset="topUp" />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Top Up Wallet"
        subtitle="Add funds to your wallet for seamless charging"
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.wallet}
        refreshing={refreshing}
        onRefresh={() => void loadBalance(true)}
        titleVariant="large"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={premiumPanelCardSx}>
            {balance && (
              <Box
                sx={(theme) => ({
                  mb: 3,
                  p: { xs: 1.75, sm: 2 },
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
                    theme.palette.primary.main,
                    0.02
                  )} 100%)`,
                })}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Current balance
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: 'primary.main', wordBreak: 'break-word', fontSize: { xs: '1.5rem', sm: '2rem' }, mt: 0.25 }}
                >
                  {formatCurrency(balance.balance, balance.currency)}
                </Typography>
              </Box>
            )}

            <GroupedListSection title="Quick amounts" sx={{ mb: 2 }}>
              <Grid container spacing={1.5} sx={{ p: 2, pt: 1 }}>
                {[10, 25, 50, 100, 200, 500].map((value) => (
                  <Grid item xs={6} key={value}>
                    <Button
                      fullWidth
                      disableElevation
                      variant={quickAmount === value ? 'contained' : 'outlined'}
                      onClick={() => handleQuickAmount(value)}
                      sx={(th) =>
                        quickAmount === value
                          ? { ...sxObject(th, compactContainedCtaSx), minHeight: 48 }
                          : { ...sxObject(th, compactOutlinedCtaSx), minHeight: 48 }
                      }
                    >
                      {formatCurrency(value)}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </GroupedListSection>

            <TextField
              fullWidth
              label="Custom amount"
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setQuickAmount(null);
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start">GHS</InputAdornment>,
              }}
              sx={(th) => ({ ...sxObject(th, authFormFieldSx), mb: 3 })}
              helperText="Minimum amount: GHS 1.00"
            />

            <Button
              fullWidth
              variant="contained"
              disableElevation
              onClick={handleTopUp}
              disabled={!amount || parseFloat(amount) <= 0}
              sx={(th) => ({ ...sxObject(th, compactContainedCtaSx), mt: 0, py: 1.25 })}
            >
              Proceed to payment
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={premiumPanelCardSx}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
              <Box
                sx={(theme) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                })}
              >
                <AccountBalanceWalletIcon sx={{ fontSize: 24 }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Why top up?
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1 }}>
              • Instant payments for charging sessions
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1 }}>
              • No need to enter payment details each time
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1 }}>
              • Secure and convenient
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Support for mobile money and cards
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {paymentDialogOpen && amount && (
        <PaystackPayment
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          amount={parseFloat(amount)}
          currency="GHS"
          userId={userId}
          onSuccess={handlePaymentSuccess}
          onError={(err) => setError(err)}
        />
      )}
    </Box>
  );
}

