import { useState, useEffect, useCallback } from 'react';
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
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StopIcon from '@mui/icons-material/Stop';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { ActiveSessionListItem } from '../../components/ios/ActiveSessionListItem';
import { AdaptiveSheet } from '../../components/ios/AdaptiveSheet';
import { useCustomerPullRefresh } from '../../contexts/CustomerPullRefreshContext';
import { triggerHaptic } from '../../utils/haptics';
import { transactionsApi, Transaction } from '../../services/transactionsApi';
import { chargePointsApi } from '../../services/chargePointsApi';
import { websocketService } from '../../services/websocket';
import { TransactionSummaryDialog } from '../../components/TransactionSummaryDialog';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { premiumEmptyStatePaperSx, premiumTableSurfaceSx } from '../../theme/jampackShell';
import {
  authPageBodySx,
  compactContainedCtaSx,
  compactErrorContainedCtaSx,
  compactOutlinedCtaSx,
  sxObject,
} from '../../styles/authShell';
import { getStoredUser } from '../../utils/authSession';
import { CUSTOMER_ROUTES } from '../../config/customerNav.paths';
import { formatCurrency, formatElapsedDurationFromStart, formatEnergyKwh } from '../../utils/formatters';
import { getTransactionStatusColor } from '../../utils/statusColors';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { CustomerChromeSkeleton } from '../../components/dashboard/CustomerChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';

export function CustomerActiveSessionsPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { loading, refreshing, updatedAt, runWithRefresh } = useLiveRefresh();
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

  const loadActiveSessions = useCallback(async (silent?: boolean) => {
    await runWithRefresh(async () => {
      try {
        setError(null);
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
          setTransactions([]);
          return false;
        }

        const active = await transactionsApi.getActive(undefined, currentUserId);
        setTransactions(active);
        return true;
      } catch (err: any) {
        setError(err.message || 'Failed to load active sessions');
        console.error('Error loading active sessions:', err);
        return false;
      }
    }, silent);
  }, [runWithRefresh]);

  useEffect(() => {
    void loadActiveSessions();
    // Refresh every 10 seconds
    const interval = setInterval(() => {
      void loadActiveSessions(true);
    }, 10000);
    
    // Listen for transaction stopped events
    const unsubscribeTransactionStopped = websocketService.on('transactionStopped', (event) => {
      const currentUserId = getCurrentUserId();
      if (!currentUserId || !event.data.transactionId) {
        return;
      }

      if (event.data.userId && event.data.userId !== currentUserId) {
        return;
      }

      void loadActiveSessions(true).then(() => {
        // Show summary dialog for completed transaction belonging to current user.
        setCompletedTransactionId(event.data.transactionId);
        setSummaryDialogOpen(true);
      });
    });

    return () => {
      clearInterval(interval);
      unsubscribeTransactionStopped();
    };
  }, [loadActiveSessions]);

  useCustomerPullRefresh(useCallback(() => void loadActiveSessions(true), [loadActiveSessions]));

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
      triggerHaptic('success');
      setStopDialogOpen(false);
      setPendingStopTransaction(null);
      // Reload active sessions after a short delay to allow backend to process
      setTimeout(() => {
        void loadActiveSessions(true);
        setStoppingTransactionId(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to stop charging session');
      setStoppingTransactionId(null);
      console.error('Error stopping transaction:', err);
    }
  };

  if (loading && transactions.length === 0) {
    return <CustomerChromeSkeleton preset="activeSessions" />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Active Charging Sessions"
        subtitle="Monitor your current charging sessions in real-time"
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.session}
        showSeconds
        refreshing={refreshing}
        onRefresh={() => void loadActiveSessions(true)}
        titleVariant="large"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {transactions.some((t) => t.recordPending) && (
        <Alert severity="info" sx={{ mb: 3 }}>
          One or more sessions are still syncing with the charger. Energy and billing may update shortly.
          Stop charging may be unavailable until the session appears with a transaction number—unplugging also ends the session on the vehicle side.
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
            onClick={() => navigate(CUSTOMER_ROUTES.stations)}
            sx={(th) => ({ ...sxObject(th, compactContainedCtaSx), width: { xs: '100%', sm: 'auto' } })}
          >
            Find stations
          </Button>
        </Paper>
      ) : useGroupedList ? (
        <Box sx={{ position: 'relative' }}>
          <TableSurfaceProgress active={loading && transactions.length > 0} ariaLabel="Loading active sessions" />
          <GroupedListSection title="Live sessions">
            {transactions.map((tx, index) => (
              <ActiveSessionListItem
                key={`${tx.chargePointId}-${tx.connectorId}-${tx.transactionId}`}
                transaction={tx}
                divider={index < transactions.length - 1}
                stopping={stoppingTransactionId === tx.transactionId}
                viewLabel={tx.recordPending ? 'Back to stations' : 'View details'}
                stopDisabled={Boolean(tx.recordPending)}
                stopTooltip={
                  tx.recordPending
                    ? 'Stop is available after the session is fully registered, or unplug the cable.'
                    : 'Send a remote stop to the charger'
                }
                onView={() =>
                  tx.recordPending
                    ? navigate(CUSTOMER_ROUTES.stations)
                    : navigate(`${CUSTOMER_ROUTES.sessionsRoot}/${tx.transactionId}`)
                }
                onStop={() => handleStopTransaction(tx)}
              />
            ))}
          </GroupedListSection>
        </Box>
      ) : (
        <Box sx={{ position: 'relative' }}>
          <TableSurfaceProgress active={loading && transactions.length > 0} ariaLabel="Loading active sessions" />
          <Grid container spacing={{ xs: 2, sm: 3 }}>
          {transactions.map((tx) => (
            <Grid
              item
              xs={12}
              key={`${tx.chargePointId}-${tx.connectorId}-${tx.transactionId}`}
            >
              <Paper elevation={0} sx={{ ...premiumTableSurfaceSx, p: { xs: 2, sm: 2.5 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {tx.chargePointId}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Connector {tx.connectorId}
                        {tx.recordPending ? ' · session sync pending' : ''}
                      </Typography>
                    </Box>
                    <Chip
                      label={tx.recordPending ? 'Active (syncing)' : tx.status}
                      color={getTransactionStatusColor(tx.status)}
                      size="small"
                      sx={{ flexShrink: 0 }}
                    />
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
                      onClick={() =>
                        tx.recordPending
                          ? navigate(CUSTOMER_ROUTES.stations)
                          : navigate(`${CUSTOMER_ROUTES.sessionsRoot}/${tx.transactionId}`)
                      }
                      sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), width: { xs: '100%', sm: 'auto' } })}
                    >
                      {tx.recordPending ? 'Back to stations' : 'View details'}
                    </Button>
                    <Tooltip
                      title={
                        tx.recordPending
                          ? 'Stop is available after the session is fully registered, or you can unplug the cable to end charging.'
                          : 'Send a remote stop to the charger'
                      }
                    >
                      <Box
                        component="span"
                        sx={{ display: 'inline-block', width: { xs: '100%', sm: 'auto' } }}
                      >
                        <Button
                          variant="contained"
                          disableElevation
                          startIcon={
                            stoppingTransactionId === tx.transactionId ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              <StopIcon />
                            )
                          }
                          onClick={() => handleStopTransaction(tx)}
                          disabled={Boolean(tx.recordPending) || stoppingTransactionId === tx.transactionId}
                          sx={(th) => ({
                            ...sxObject(th, compactErrorContainedCtaSx),
                            width: { xs: '100%', sm: 'auto' },
                          })}
                        >
                          {stoppingTransactionId === tx.transactionId ? 'Stopping…' : 'Stop charging'}
                        </Button>
                      </Box>
                    </Tooltip>
                  </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
        </Box>
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

      <AdaptiveSheet
        open={stopDialogOpen}
        onClose={() => setStopDialogOpen(false)}
        title="Stop charging session?"
        maxWidth="xs"
        actions={
          <>
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
          </>
        }
      >
        <Typography component="p" sx={authPageBodySx}>
          {pendingStopTransaction
            ? `Stop charging at ${pendingStopTransaction.chargePointId}?`
            : 'Stop this charging session?'}
        </Typography>
      </AdaptiveSheet>
    </Box>
  );
}

