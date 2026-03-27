import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
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
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/Add';
import { walletApi, WalletBalance, WalletTransaction } from '../../services/walletApi';

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
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setError('User not logged in');
        return;
      }
      const user = JSON.parse(userStr);
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

  const formatCurrency = (amount: number, currency: string = 'GHS') => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'top_up':
      case 'credit':
        return 'success';
      case 'debit':
      case 'payment':
        return 'error';
      default:
        return 'default';
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
    <Box>
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ minWidth: 0, flex: '1 1 200px' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}>
            My Wallet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your wallet balance and view transaction history
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/user/wallet/top-up')}
          sx={{ width: { xs: '100%', sm: 'auto' }, alignSelf: { xs: 'stretch', sm: 'auto' } }}
        >
          Top Up Wallet
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {balance && (
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ py: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <AccountBalanceWalletIcon sx={{ fontSize: 40, color: 'primary.main', flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" color="text.secondary">
                      Current Balance
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 700,
                        color: 'text.primary',
                        fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' },
                        wordBreak: 'break-word',
                        lineHeight: 1.2,
                      }}
                    >
                      {formatCurrency(balance.balance, balance.currency)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Transaction History
          </Typography>
        </Box>
        <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                        color={getTypeColor(tx.type) as any}
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
                        color={tx.status === 'completed' ? 'success' : 'default'}
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

