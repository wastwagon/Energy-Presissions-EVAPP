import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { walletApi, WalletBalance } from '../../services/walletApi';
import { PaystackPayment } from '../../components/PaystackPayment';
import { dashboardPageTitleSx, dashboardPageSubtitleSx } from '../../theme/jampackShell';
import { getStoredUser } from '../../utils/authSession';
import { formatCurrency } from '../../utils/formatters';

export function CustomerTopUpPage() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [quickAmount, setQuickAmount] = useState<number | null>(null);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      setLoading(true);
      const user = getStoredUser();
      if (typeof user?.id !== 'number') {
        setError('User not logged in');
        return;
      }
      const balanceData = await walletApi.getBalance(user.id);
      setBalance(balanceData);
    } catch (err: any) {
      setError(err.message || 'Failed to load wallet balance');
      console.error('Error loading balance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (value: number) => {
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
    setPaymentDialogOpen(false);
    loadBalance();
    navigate('/user/wallet');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
          Top Up Wallet
        </Typography>
        <Typography variant="body2" sx={dashboardPageSubtitleSx}>
          Add funds to your wallet for seamless charging
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            {balance && (
              <Box sx={{ mb: 3, p: { xs: 1.5, sm: 2 }, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Current Balance
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: 'primary.main', wordBreak: 'break-word', fontSize: { xs: '1.5rem', sm: '2rem' } }}
                >
                  {formatCurrency(balance.balance, balance.currency)}
                </Typography>
              </Box>
            )}

            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Select Amount
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[10, 25, 50, 100, 200, 500].map((value) => (
                <Grid item xs={6} sm={4} key={value}>
                  <Button
                    fullWidth
                    variant={quickAmount === value ? 'contained' : 'outlined'}
                    onClick={() => handleQuickAmount(value)}
                    sx={{
                      py: 2,
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(value)}
                  </Button>
                </Grid>
              ))}
            </Grid>

            <TextField
              fullWidth
              label="Custom Amount"
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setQuickAmount(null);
              }}
              InputProps={{
                startAdornment: <InputAdornment position="start">GHS</InputAdornment>,
              }}
              sx={{ mb: 3 }}
              helperText="Minimum amount: GHS 1.00"
            />

            <Button fullWidth variant="contained" size="large" onClick={handleTopUp} disabled={!amount || parseFloat(amount) <= 0} sx={{ py: 1.5 }}>
              Proceed to Payment
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountBalanceWalletIcon sx={{ fontSize: 32, color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Why Top Up?</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Instant payments for charging sessions
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • No need to enter payment details each time
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                • Secure and convenient
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Support for mobile money and cards
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {paymentDialogOpen && amount && (
        <PaystackPayment
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          amount={parseFloat(amount)}
          currency="GHS"
          onSuccess={handlePaymentSuccess}
          onError={(err) => setError(err)}
        />
      )}
    </Box>
  );
}

