import { useState, useEffect, useCallback } from 'react';
import { useCustomerNavBack } from '../../hooks/useCustomerNavBack';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  InputAdornment,
} from '@mui/material';
import { walletApi, WalletBalance } from '../../services/walletApi';
import { PaystackPayment } from '../../components/PaystackPayment';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { useCustomerPullRefresh } from '../../contexts/CustomerPullRefreshContext';
import { triggerHaptic } from '../../utils/haptics';
import {
  authFormFieldSx,
  compactContainedCtaSx,
  compactOutlinedCtaSx,
  sxObject,
} from '../../styles/authShell';
import { getStoredUser } from '../../utils/authSession';
import { CUSTOMER_ROUTES } from '../../config/customerNav.paths';
import { formatCurrency } from '../../utils/formatters';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { CustomerChromeSkeleton } from '../../components/dashboard/CustomerChromeSkeleton';
import { UserErrorAlert } from '../../components/UserErrorAlert';
import { formatUserFacingErrorMessage, UserMessages } from '../../utils/userFriendlyErrors';

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
          setError(UserMessages.notSignedIn);
          return false;
        }
        const balanceData = await walletApi.getBalance(user.id);
        setBalance(balanceData);
        return true;
      } catch (err: unknown) {
        setError(formatUserFacingErrorMessage(err, 'wallet'));
        console.error('Error loading balance:', err);
        return false;
      }
    }, silent);
  }, [runWithRefresh]);

  useEffect(() => {
    void loadBalance();
  }, [loadBalance]);

  useCustomerPullRefresh(useCallback(() => void loadBalance(true), [loadBalance]));

  const goBack = useCallback(() => navigate(CUSTOMER_ROUTES.wallet), [navigate]);
  useCustomerNavBack(goBack, 'Back to wallet');

  const handleQuickAmount = (value: number) => {
    triggerHaptic('light');
    setQuickAmount(value);
    setAmount(value.toString());
  };

  const handleTopUp = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError(UserMessages.topUpInvalidAmount);
      return;
    }
    if (numAmount < 1) {
      setError(UserMessages.topUpInvalidAmount);
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
        title="Top up"
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.wallet}
        refreshing={refreshing}
        onRefresh={() => void loadBalance(true)}
        titleVariant="large"
        containerSx={{ mb: 1.5 }}
      />

      {error && (
        <UserErrorAlert error={error} context="payments" sx={{ mb: 3 }} onClose={() => setError(null)} />
      )}

      {balance ? (
        <GroupedListSection>
          <GroupedListRow
            primary="Available"
            end={
              <Typography sx={{ fontWeight: 600, fontSize: '1rem' }}>
                {formatCurrency(balance.balance, balance.currency)}
              </Typography>
            }
            showChevron={false}
          />
        </GroupedListSection>
      ) : null}

      <GroupedListSection title="Amount">
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
        sx={(th) => ({ ...sxObject(th, authFormFieldSx), mb: 2 })}
        helperText="Minimum GHS 1"
      />

      <Button
        fullWidth
        variant="contained"
        disableElevation
        onClick={handleTopUp}
        disabled={!amount || parseFloat(amount) <= 0}
        sx={(th) => ({ ...sxObject(th, compactContainedCtaSx), mt: 0, py: 1.25, minHeight: 48 })}
      >
        Pay
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, px: 0.5, lineHeight: 1.45 }}>
        Mobile money or card. Funds appear in your wallet for charging.
      </Typography>

      {paymentDialogOpen && amount && (
        <PaystackPayment
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          amount={parseFloat(amount)}
          currency="GHS"
          userId={userId}
          walletTopUp
          onSuccess={handlePaymentSuccess}
          onError={(err) => setError(err)}
        />
      )}
    </Box>
  );
}

