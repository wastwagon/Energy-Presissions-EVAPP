import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Button,
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
import { CustomerQuickActions } from '../../components/dashboard/CustomerQuickActions';
import {
  dashboardPageTitleSx,
  dashboardPageSubtitleSx,
  premiumEmptyStatePaperSx,
  premiumTableSurfaceSx,
} from '../../theme/jampackShell';
import {
  compactContainedCtaSx,
  compactErrorContainedCtaSx,
  compactOutlinedCtaSx,
  premiumDialogPaperSx,
  sxObject,
} from '../../styles/authShell';
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
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
          <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
            Active charging sessions
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            Monitor your current charging sessions in real time
          </Typography>
        </Box>
      </Box>

      <CustomerQuickActions preset="sessions_active" />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {transactions.length === 0 ? (
        <Paper elevation={0} sx={premiumEmptyStatePaperSx}>
          <Box
            sx={(theme) => ({
              width: 72,
              height: 72,
              mx: 'auto',
              mb: 2,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: theme.palette.action.hover,
              color: 'text.secondary',
            })}
          >
            <BatteryChargingFullIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            No active sessions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            You do not have any active charging sessions at the moment.
          </Typography>
          <Button
            variant="contained"
            disableElevation
            onClick={() => navigate('/stations')}
            sx={(th) => ({ ...sxObject(th, compactContainedCtaSx), width: { xs: '100%', sm: 'auto' } })}
          >
            Find stations
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {transactions.map((tx) => (
            <Grid item xs={12} key={tx.id}>
              <Paper elevation={0} sx={{ ...premiumTableSurfaceSx, p: { xs: 2, sm: 2.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {tx.chargePointId}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Connector {tx.connectorId}
                      </Typography>
                    </Box>
                    <Chip label={tx.status} color={getTransactionStatusColor(tx.status)} size="small" sx={{ flexShrink: 0 }} />
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Duration
                      </Typography>
                      <Typography variant="body1" fontWeight={500} sx={{ mt: 0.25 }}>
                        {formatElapsedDurationFromStart(tx.startTime)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Energy
                      </Typography>
                      <Typography variant="body1" fontWeight={500} sx={{ mt: 0.25 }}>
                        {formatEnergyKwh(tx.totalEnergyKwh)} kWh
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Cost
                      </Typography>
                      <Typography variant="body1" fontWeight={500} sx={{ mt: 0.25 }}>
                        {formatCurrency(tx.totalCost, 'GHS')}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Started
                      </Typography>
                      <Typography variant="body1" fontWeight={500} sx={{ mt: 0.25 }}>
                        {new Date(tx.startTime).toLocaleTimeString()}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Box
                    sx={{
                      mt: 2,
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 1.5,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Button
                      variant="outlined"
                      disableElevation
                      startIcon={<VisibilityIcon />}
                      onClick={() => navigate(`/user/sessions/${tx.transactionId}`)}
                      sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: { xs: '100%', sm: 'auto' } })}
                    >
                      View details
                    </Button>
                    <Button
                      variant="contained"
                      disableElevation
                      startIcon={
                        stoppingTransactionId === tx.transactionId ? <CircularProgress size={16} color="inherit" /> : <StopIcon />
                      }
                      onClick={() => handleStopTransaction(tx)}
                      disabled={stoppingTransactionId === tx.transactionId}
                      sx={(th) => ({
                        ...sxObject(th, compactErrorContainedCtaSx),
                        width: { xs: '100%', sm: 'auto' },
                      })}
                    >
                      {stoppingTransactionId === tx.transactionId ? 'Stopping…' : 'Stop charging'}
                    </Button>
                  </Box>
              </Paper>
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

      <Dialog
        open={stopDialogOpen}
        onClose={() => setStopDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Stop charging session?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            {pendingStopTransaction
              ? `Stop charging at ${pendingStopTransaction.chargePointId}?`
              : 'Stop this charging session?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setStopDialogOpen(false)} sx={(th) => sxObject(th, compactOutlinedCtaSx)}>
            Cancel
          </Button>
          <Button
            onClick={confirmStopTransaction}
            variant="contained"
            disableElevation
            sx={(th) => sxObject(th, compactErrorContainedCtaSx)}
          >
            Stop charging
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

