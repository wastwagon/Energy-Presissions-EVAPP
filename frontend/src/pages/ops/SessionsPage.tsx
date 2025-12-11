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
  Tabs,
  Tab,
  Button,
} from '@mui/material';
import { transactionsApi, Transaction } from '../../services/transactionsApi';
import { chargePointsApi } from '../../services/chargePointsApi';

export function SessionsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [activeTransactions, setActiveTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTransactions();
    // Refresh active transactions every 10 seconds
    const interval = setInterval(() => {
      if (activeTab === 0) {
        loadActiveTransactions();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const loadTransactions = async () => {
    try {
      setError(null);
      const [active, all] = await Promise.all([
        transactionsApi.getActive(),
        transactionsApi.getAll(50, 0),
      ]);
      setActiveTransactions(active);
      setAllTransactions(all.transactions);
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveTransactions = async () => {
    try {
      const active = await transactionsApi.getActive();
      setActiveTransactions(active);
    } catch (err: any) {
      console.error('Error loading active transactions:', err);
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCurrency = (amount?: number, currency: string = 'GHS') => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency,
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

  const transactions = activeTab === 0 ? activeTransactions : allTransactions;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Charging Sessions
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mt: 2 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label={`Active (${activeTransactions.length})`} />
          <Tab label={`All Sessions (${allTransactions.length})`} />
        </Tabs>

        {transactions.length === 0 ? (
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {activeTab === 0
                ? 'No active charging sessions.'
                : 'No transactions found.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Charge Point</TableCell>
                  <TableCell>Connector</TableCell>
                  <TableCell>IdTag</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Energy (kWh)</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow 
                    key={tx.transactionId}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/ops/sessions/${tx.transactionId}`)}
                  >
                    <TableCell>{tx.transactionId}</TableCell>
                    <TableCell>{tx.chargePointId}</TableCell>
                    <TableCell>{tx.connectorId}</TableCell>
                    <TableCell>{tx.idTag || '-'}</TableCell>
                    <TableCell>
                      {new Date(tx.startTime).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {tx.durationMinutes !== undefined
                        ? formatDuration(tx.durationMinutes)
                        : tx.status === 'Active'
                        ? 'In progress...'
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {tx.totalEnergyKwh !== undefined
                        ? tx.totalEnergyKwh.toFixed(3)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(tx.totalCost, tx.currency)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tx.status}
                        color={getStatusColor(tx.status) as any}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}

