import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/Add';
import { walletApi, WalletBalance, WalletTransaction } from '../../services/walletApi';
import {
  dashboardPageTitleSx,
  dashboardPageSubtitleSx,
  premiumPanelCardSx,
  premiumTableSurfaceSx,
} from '../../theme/jampackShell';
import { compactContainedCtaSx, sxObject } from '../../styles/authShell';
import { getStoredUser } from '../../utils/authSession';
import { formatCurrency } from '../../utils/formatters';
import { getPaymentStatusColor, getWalletTransactionTypeColor } from '../../utils/statusColors';
import { CustomerQuickActions } from '../../components/dashboard/CustomerQuickActions';
import { CUSTOMER_ROUTES } from '../../config/customerNav.paths';

export function CustomerWalletPage() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = getStoredUser();
      if (typeof user?.id !== 'number') {
        setError('User not logged in');
        return;
      }
      const [balanceData, transactionsData] = await Promise.all([
        walletApi.getBalance(user.id),
        walletApi.getTransactions(user.id, 20, 0),
      ]);
      setBalance(balanceData);
      setTransactions(transactionsData.transactions);
    } catch (err: any) {
      setError(err.message || 'Failed to load wallet data');
      console.error('Error loading wallet data:', err);
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

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ minWidth: 0, flex: '1 1 200px' }}>
          <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
            My Wallet
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            Manage your wallet balance and view transaction history
          </Typography>
        </Box>
        <Button
          variant="contained"
          disableElevation
          startIcon={<AddIcon />}
          onClick={() => navigate(CUSTOMER_ROUTES.walletTopUp)}
          sx={(th) => ({
            ...sxObject(th, compactContainedCtaSx),
            width: { xs: '100%', sm: 'auto' },
            alignSelf: { xs: 'stretch', sm: 'auto' },
          })}
        >
          Top Up Wallet
        </Button>
      </Box>

      <CustomerQuickActions preset="wallet" />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {balance && (
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={(theme) => ({
                ...premiumPanelCardSx,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.07)} 0%, ${alpha(
                  theme.palette.primary.main,
                  0.02
                )} 100%)`,
                borderColor: alpha(theme.palette.primary.main, 0.18),
              })}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box
                  sx={(theme) => ({
                    width: 52,
                    height: 52,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: 'primary.main',
                  })}
                >
                  <AccountBalanceWalletIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Current balance
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: 'text.primary',
                      fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
                      wordBreak: 'break-word',
                      lineHeight: 1.2,
                      mt: 0.25,
                    }}
                  >
                    {formatCurrency(balance.balance, balance.currency)}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Paper elevation={0} sx={premiumTableSurfaceSx}>
        <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Transaction history
          </Typography>
        </Box>
        <TableContainer sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Balance After</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No transactions yet
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={tx.type.replace('_', ' ').toUpperCase()}
                        color={getWalletTransactionTypeColor(tx.type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{tx.description || '-'}</TableCell>
                    <TableCell
                      sx={{
                        color: tx.type === 'debit' || tx.type === 'payment' ? 'error.main' : 'success.main',
                        fontWeight: 600,
                      }}
                    >
                      {tx.type === 'debit' || tx.type === 'payment' ? '-' : '+'}
                      {formatCurrency(Math.abs(tx.amount))}
                    </TableCell>
                    <TableCell>{formatCurrency(tx.balanceAfter)}</TableCell>
                    <TableCell>
                      <Chip
                        label={tx.status}
                        color={getPaymentStatusColor(tx.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

