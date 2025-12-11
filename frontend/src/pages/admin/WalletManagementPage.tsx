import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { usersApi, User } from '../../services/usersApi';
import { walletApi, WalletTransaction } from '../../services/walletApi';

export function WalletManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topUpDialogOpen, setTopUpDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setError(null);
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadUserTransactions = async (userId: number) => {
    try {
      const { transactions } = await walletApi.getTransactions(userId, 20, 0);
      setWalletTransactions(transactions);
    } catch (err: any) {
      console.error('Error loading wallet transactions:', err);
    }
  };

  const handleTopUp = async () => {
    if (!selectedUser || !amount) return;

    setProcessing(true);
    setError(null);

    try {
      await walletApi.topUp(selectedUser.id, parseFloat(amount), note);
      setTopUpDialogOpen(false);
      setAmount('');
      setNote('');
      await loadUsers();
      if (selectedUser) {
        await loadUserTransactions(selectedUser.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to top up wallet');
    } finally {
      setProcessing(false);
    }
  };

  const handleAdjust = async () => {
    if (!selectedUser || !amount || !note) return;

    setProcessing(true);
    setError(null);

    try {
      await walletApi.adjust(selectedUser.id, parseFloat(amount), note);
      setAdjustDialogOpen(false);
      setAmount('');
      setNote('');
      await loadUsers();
      if (selectedUser) {
        await loadUserTransactions(selectedUser.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to adjust wallet');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'GHS') => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'TopUp':
        return 'success';
      case 'Payment':
        return 'error';
      case 'Refund':
        return 'info';
      case 'Adjustment':
        return 'warning';
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Wallet Management
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Users
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Balance</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow
                        key={user.id}
                        hover
                        selected={selectedUser?.id === user.id}
                        onClick={() => {
                          setSelectedUser(user);
                          loadUserTransactions(user.id);
                        }}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color={(user.balance ?? 0) >= 0 ? 'success.main' : 'error.main'}
                            fontWeight="bold"
                          >
                            {formatCurrency(user.balance ?? 0, user.currency)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                              setTopUpDialogOpen(true);
                            }}
                          >
                            Top Up
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Wallet Transactions
                  {selectedUser && ` - ${selectedUser.firstName} ${selectedUser.lastName}`}
                </Typography>
                {selectedUser && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setAdjustDialogOpen(true)}
                  >
                    Adjust Balance
                  </Button>
                )}
              </Box>

              {selectedUser ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Balance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {walletTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={tx.type}
                              color={getTransactionTypeColor(tx.type) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={tx.type === 'TopUp' || tx.type === 'Refund' ? 'success.main' : 'error.main'}
                            >
                              {tx.type === 'TopUp' || tx.type === 'Refund' ? '+' : '-'}
                              {formatCurrency(tx.amount, tx.currency)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(tx.balanceAfter, tx.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {walletTransactions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No transactions found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                  Select a user to view wallet transactions
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Up Dialog */}
      <Dialog open={topUpDialogOpen} onClose={() => setTopUpDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Top Up Wallet</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                User: {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Balance: {formatCurrency(selectedUser.balance ?? 0, selectedUser.currency)}
              </Typography>
            </Box>
          )}
          <TextField
            label="Amount"
            type="number"
            fullWidth
            margin="normal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
            required
            disabled={processing}
          />
          <TextField
            label="Note (Optional)"
            fullWidth
            margin="normal"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            rows={3}
            disabled={processing}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTopUpDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleTopUp}
            variant="contained"
            disabled={processing || !amount || parseFloat(amount) <= 0}
            startIcon={processing ? <CircularProgress size={20} /> : null}
          >
            {processing ? 'Processing...' : 'Top Up'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Adjust Dialog */}
      <Dialog open={adjustDialogOpen} onClose={() => setAdjustDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust Wallet Balance</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                User: {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current Balance: {formatCurrency(selectedUser.balance ?? 0, selectedUser.currency)}
              </Typography>
              <Alert severity="info" sx={{ mt: 1 }}>
                Use positive amount to add, negative amount to subtract
              </Alert>
            </Box>
          )}
          <TextField
            label="Amount"
            type="number"
            fullWidth
            margin="normal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputProps={{ step: 0.01 }}
            required
            disabled={processing}
            helperText="Positive to add, negative to subtract"
          />
          <TextField
            label="Note (Required)"
            fullWidth
            margin="normal"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            rows={3}
            required
            disabled={processing}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={handleAdjust}
            variant="contained"
            disabled={processing || !amount || !note || parseFloat(amount) === 0}
            startIcon={processing ? <CircularProgress size={20} /> : null}
          >
            {processing ? 'Processing...' : 'Adjust'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}



