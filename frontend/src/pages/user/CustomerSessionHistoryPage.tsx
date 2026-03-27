import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip,
  CircularProgress,
  Alert,
  Button,
  Pagination,
} from '@mui/material';
import { transactionsApi, Transaction } from '../../services/transactionsApi';
import HistoryIcon from '@mui/icons-material/History';
import VisibilityIcon from '@mui/icons-material/Visibility';

export function CustomerSessionHistoryPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setError('User not logged in');
        return;
      }
      const user = JSON.parse(userStr);
      const offset = (page - 1) * limit;
      const response = await transactionsApi.getAll(limit, offset);
      // Filter for current user
      const userTransactions = response.transactions.filter((t) => t.userId === user.id);
      setTransactions(userTransactions);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load session history');
      console.error('Error loading session history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCurrency = (amount?: number, currency?: string) => {
    if (amount === undefined || amount === null) return '-';
    // Always use GHS for Ghana operations, ignore any other currency values
    const safeCurrency = 'GHS';
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: safeCurrency,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'info';
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'warning';
      case 'Failed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
          Session History
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          View all your past charging sessions
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {transactions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Session History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You haven't completed any charging sessions yet.
          </Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Charge Point</TableCell>
                  <TableCell>Energy (kWh)</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell>{tx.transactionId}</TableCell>
                    <TableCell>{tx.chargePointId}</TableCell>
                    <TableCell>
                      {tx.totalEnergyKwh !== undefined && tx.totalEnergyKwh !== null
                        ? (typeof tx.totalEnergyKwh === 'number' 
                            ? tx.totalEnergyKwh.toFixed(2)
                            : parseFloat(String(tx.totalEnergyKwh)).toFixed(2))
                        : '-'}
                    </TableCell>
                    <TableCell>{formatDuration(tx.durationMinutes)}</TableCell>
                    <TableCell>{formatCurrency(tx.totalCost)}</TableCell>
                    <TableCell>
                      <Chip label={tx.status} color={getStatusColor(tx.status) as any} size="small" />
                    </TableCell>
                    <TableCell>{new Date(tx.startTime).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`/user/sessions/${tx.transactionId}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {total > limit && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(total / limit)}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

