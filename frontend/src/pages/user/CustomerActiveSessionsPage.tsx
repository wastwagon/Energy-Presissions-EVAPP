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
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { transactionsApi, Transaction } from '../../services/transactionsApi';
import { chargePointsApi } from '../../services/chargePointsApi';
import { websocketService } from '../../services/websocket';
import { TransactionSummaryDialog } from '../../components/TransactionSummaryDialog';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StopIcon from '@mui/icons-material/Stop';

export function CustomerActiveSessionsPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [completedTransactionId, setCompletedTransactionId] = useState<number | null>(null);
  const [stoppingTransactionId, setStoppingTransactionId] = useState<number | null>(null);

  useEffect(() => {
    loadActiveSessions();
    // Refresh every 10 seconds
    const interval = setInterval(loadActiveSessions, 10000);
    
    // Listen for transaction stopped events
    const unsubscribeTransactionStopped = websocketService.on('transactionStopped', (event) => {
      // Check if this transaction belongs to current user
      const userStr = localStorage.getItem('user');
      if (userStr && event.data.transactionId) {
        const user = JSON.parse(userStr);
        // Reload to check if transaction was for this user
        loadActiveSessions().then(() => {
          // Show summary dialog for completed transaction
          setCompletedTransactionId(event.data.transactionId);
          setSummaryDialogOpen(true);
        });
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribeTransactionStopped();
    };
  }, []);

  const loadActiveSessions = async () => {
    try {
      setError(null);
      const active = await transactionsApi.getActive();
      // Filter for current user
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const userTransactions = active.filter((t) => t.userId === user.id);
        setTransactions(userTransactions);
      } else {
        setTransactions([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load active sessions');
      console.error('Error loading active sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    // Always use GHS for Ghana operations
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  const handleStopTransaction = async (transaction: Transaction) => {
    if (!window.confirm(`Are you sure you want to stop charging at ${transaction.chargePointId}?`)) {
      return;
    }

    try {
      setStoppingTransactionId(transaction.transactionId);
      setError(null);
      await chargePointsApi.remoteStop(transaction.chargePointId, transaction.transactionId);
      // Reload active sessions after a short delay to allow backend to process
      setTimeout(() => {
        loadActiveSessions();
        setStoppingTransactionId(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to stop charging session');
      setStoppingTransactionId(null);
      console.error('Error stopping transaction:', err);
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
          Active Charging Sessions
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Monitor your current charging sessions in real-time
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {transactions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <BatteryChargingFullIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Active Sessions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            You don't have any active charging sessions at the moment.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/stations')}>
            Find Stations
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {transactions.map((tx) => (
            <Grid item xs={12} key={tx.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {tx.chargePointId}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Connector {tx.connectorId}
                      </Typography>
                    </Box>
                    <Chip label={tx.status} color="info" />
                  </Box>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Duration
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDuration(tx.startTime)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Energy
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {tx.totalEnergyKwh !== undefined && tx.totalEnergyKwh !== null
                          ? (typeof tx.totalEnergyKwh === 'number' 
                              ? tx.totalEnergyKwh.toFixed(2)
                              : parseFloat(String(tx.totalEnergyKwh)).toFixed(2))
                          : '-'} kWh
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Cost
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatCurrency(tx.totalCost)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Started
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {new Date(tx.startTime).toLocaleTimeString()}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => navigate(`/user/sessions/${tx.transactionId}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={stoppingTransactionId === tx.transactionId ? <CircularProgress size={16} /> : <StopIcon />}
                      onClick={() => handleStopTransaction(tx)}
                      disabled={stoppingTransactionId === tx.transactionId}
                    >
                      {stoppingTransactionId === tx.transactionId ? 'Stopping...' : 'Stop Charging'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Transaction Summary Dialog */}
      {completedTransactionId && (
        <TransactionSummaryDialog
          open={summaryDialogOpen}
          onClose={() => {
            setSummaryDialogOpen(false);
            setCompletedTransactionId(null);
          }}
          transactionId={completedTransactionId}
          onRefresh={loadActiveSessions}
        />
      )}
    </Box>
  );
}

