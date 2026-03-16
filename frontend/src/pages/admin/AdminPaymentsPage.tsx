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
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Pagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PaymentIcon from '@mui/icons-material/Payment';
import { paymentsApi, Payment } from '../../services/paymentsApi';

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    loadPayments();
  }, [page]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const isAdmin = user?.accountType === 'Admin' || user?.accountType === 'SuperAdmin';
      if (isAdmin) {
        const { payments: list, total } = await paymentsApi.getAllPayments(limit, (page - 1) * limit);
        setPayments(list);
        setTotalPayments(total);
      } else {
        const response = await paymentsApi.getUserPayments();
        const paymentsList = Array.isArray(response) ? response : response.payments || [];
        setPayments(paymentsList);
        setTotalPayments(paymentsList.length);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payments');
      console.error('Error loading payments:', err);
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredPayments = payments.filter(
    (payment) =>
      payment.id.toString().includes(searchTerm) ||
      payment.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.status.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
          Payment Management
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          View and manage all payment transactions
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search payments by ID, method, or status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Payment ID</TableCell>
              <TableCell>Transaction ID</TableCell>
              <TableCell>User ID</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Gateway</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <PaymentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm ? 'No payments found matching your search' : 'No payments yet'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id} hover>
                  <TableCell>#{payment.id}</TableCell>
                  <TableCell>{payment.transactionId || '-'}</TableCell>
                  <TableCell>{payment.userId}</TableCell>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {formatCurrency(payment.amount, payment.currency)}
                    </Typography>
                  </TableCell>
                  <TableCell>{payment.paymentMethod}</TableCell>
                  <TableCell>{payment.paymentGateway || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={payment.status}
                      color={getStatusColor(payment.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {(totalPayments > limit || filteredPayments.length > limit) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={Math.ceil(totalPayments / limit)}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}

