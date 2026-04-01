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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { transactionsApi, Transaction } from '../../services/transactionsApi';
import { chargePointsApi } from '../../services/chargePointsApi';
import { websocketService } from '../../services/websocket';
import { TransactionSummaryDialog } from '../../components/TransactionSummaryDialog';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StopIcon from '@mui/icons-material/Stop';
import { dashboardPageTitleSx, dashboardPageSubtitleSx } from '../../theme/jampackShell';
import { getStoredUser } from '../../utils/authSession';
import { formatCurrency, formatElapsedDurationFromStart, formatEnergyKwh } from '../../utils/formatters';
import { getTransactionStatusColor } from '../../utils/statusColors';

export function CustomerActiveSessionsPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [completedTransactionId, setCompletedTransactionId] = useState<number | null>(null);
  const [stoppingTransactionId, setStoppingTransactionId] = useState<number | null>(null);
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [pendingStopTransaction, setPendingStopTransaction] = useState<Transaction | null>(null);

  const getCurrentUserId = () => {
    const user = getStoredUser();
    return typeof user?.id === 'number' ? user.id : null;
  };

  useEffect(() => {
    loadActiveSessions();
    // Refresh every 10 seconds
    const interval = setInterval(loadActiveSessions, 10000);
    
    // Listen for transaction stopped events
    const unsubscribeTransactionStopped = websocketService.on('transactionStopped', (event) => {
      const currentUserId = getCurrentUserId();
      if (!currentUserId || !event.data.transactionId) {
        return;
      }

      if (event.data.userId && event.data.userId !== currentUserId) {
        return;
      }

      loadActiveSessions().then(() => {
        // Show summary dialog for completed transaction belonging to current user.
        setCompletedTransactionId(event.data.transactionId);
        setSummaryDialogOpen(true);
      });
    });

    return () => {
      clearInterval(interval);
      unsubscribeTransactionStopped();
    };
  }, []);

  const loadActiveSessions = async () => {
    try {
      setError(null);
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        setTransactions([]);
        return;
      }

      const active = await transactionsApi.getActive(undefined, currentUserId);
      setTransactions(active);
    } catch (err: any) {
      setError(err.message || 'Failed to load active sessions');
      console.error('Error loading active sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStopTransaction = (transaction: Transaction) => {
    setPendingStopTransaction(transaction);
    setStopDialogOpen(true);
  };

  const confirmStopTransaction = async () => {
    if (!pendingStopTransaction) return;
    try {
      setStoppingTransactionId(pendingStopTransaction.transactionId);
      setError(null);
      await chargePointsApi.remoteStop(
        pendingStopTransaction.chargePointId,
        pendingStopTransaction.transactionId,
      );
      setStopDialogOpen(false);
      setPendingStopTransaction(null);
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
        <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
          Active Charging Sessions
        </Typography>
        <Typography variant="body2" sx={dashboardPageSubtitleSx}>
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
                    <Chip label={tx.status} color={getTransactionStatusColor(tx.status)} />
                  </Box>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Duration
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatElapsedDurationFromStart(tx.startTime)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Energy
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatEnergyKwh(tx.totalEnergyKwh)} kWh
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Cost
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatCurrency(tx.totalCost, 'GHS')}
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

      <Dialog open={stopDialogOpen} onClose={() => setStopDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Stop charging session?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {pendingStopTransaction
              ? `Are you sure you want to stop charging at ${pendingStopTransaction.chargePointId}?`
              : 'Are you sure you want to stop this charging session?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStopDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmStopTransaction} color="error" variant="contained">
            Stop Charging
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

