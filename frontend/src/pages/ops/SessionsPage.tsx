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
  LinearProgress,
} from '@mui/material';
import { useOpsBasePath } from '../../hooks/useOpsBasePath';
import { transactionsApi, Transaction } from '../../services/transactionsApi';
import { websocketService } from '../../services/websocket';
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumTableSurfaceSx } from '../../theme/jampackShell';
import { formatCurrency, formatDurationMinutes, formatEnergyKwh } from '../../utils/formatters';
import { getTransactionStatusColor } from '../../utils/statusColors';
import { OpsQuickActions } from '../../components/dashboard/OpsQuickActions';
import { LiveDataMeta } from '../../components/dashboard/LiveDataMeta';
import { RefreshButton } from '../../components/dashboard/RefreshButton';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';

export function SessionsPage() {
  const navigate = useNavigate();
  const opsBase = useOpsBasePath();
  const [activeTab, setActiveTab] = useState(0);
  const [activeTransactions, setActiveTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    loadTransactions();
    
    // Set up WebSocket listeners for real-time updates
    const unsubscribeTransactionStarted = websocketService.on('transactionStarted', () => {
      loadTransactions(); // Reload when new transaction starts
    });

    const unsubscribeTransactionStopped = websocketService.on('transactionStopped', () => {
      loadTransactions(); // Reload when transaction stops
    });

    // Refresh active transactions every 10 seconds
    const interval = setInterval(() => {
      if (activeTab === 0) {
        loadActiveTransactions();
      }
    }, 10000);
    
    return () => {
      unsubscribeTransactionStarted();
      unsubscribeTransactionStopped();
      clearInterval(interval);
    };
  }, [activeTab]);

  const loadTransactions = async (silent?: boolean) => {
    const isQuiet = silent === true;
    try {
      if (isQuiet) setRefreshing(true);
      setError(null);
      const [active, all] = await Promise.all([
        transactionsApi.getActive(),
        transactionsApi.getAll(50, 0),
      ]);
      setActiveTransactions(active);
      setAllTransactions(all.transactions);
      setUpdatedAt(Date.now());
    } catch (err: any) {
      setError(err.message || 'Failed to load transactions');
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadActiveTransactions = async () => {
    try {
      const active = await transactionsApi.getActive();
      setActiveTransactions(active);
      setUpdatedAt(Date.now());
    } catch (err: any) {
      console.error('Error loading active transactions:', err);
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
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      {refreshing && (
        <LinearProgress sx={{ mb: 2, borderRadius: 1 }} aria-label="Updating sessions data" />
      )}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
            <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
              Charging Sessions
            </Typography>
            <Typography variant="body2" sx={dashboardPageSubtitleSx}>
              View active sessions and transaction history across your network.
            </Typography>
            <LiveDataMeta updatedAt={updatedAt} liveLabel={LIVE_DATA_LABELS.sessions} showSeconds />
          </Box>
          <RefreshButton
            refreshing={refreshing}
            onClick={() => void loadTransactions(true)}
            sx={{ width: { xs: '100%', sm: 'auto' }, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
          />
        </Box>
      </Box>

      <OpsQuickActions />

      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ ...premiumTableSurfaceSx, mt: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            px: { xs: 1, sm: 2 },
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': { minHeight: 48, textTransform: 'none', fontWeight: 600 },
          }}
          aria-label="Charging session sections"
        >
          <Tab label={`Active (${activeTransactions.length})`} id="ops-sessions-tab-0" aria-controls="ops-sessions-panel-0" />
          <Tab label={`All sessions (${allTransactions.length})`} id="ops-sessions-tab-1" aria-controls="ops-sessions-panel-1" />
        </Tabs>

        <Box role="tabpanel" id={`ops-sessions-panel-${activeTab}`} aria-labelledby={`ops-sessions-tab-${activeTab}`}>
        {transactions.length === 0 ? (
          <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Typography variant="body2" color="text.secondary">
              {activeTab === 0 ? 'No active charging sessions.' : 'No transactions found.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table size="small" stickyHeader>
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
                    key={`${tx.chargePointId}-${tx.connectorId}-${tx.transactionId}`}
                    sx={{ cursor: 'pointer' }}
                    onClick={() =>
                      tx.recordPending
                        ? navigate(`${opsBase}/devices/${encodeURIComponent(tx.chargePointId)}`)
                        : navigate(`${opsBase}/sessions/${tx.transactionId}`)
                    }
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter' && e.key !== ' ') return;
                      e.preventDefault();
                      if (tx.recordPending) {
                        navigate(`${opsBase}/devices/${encodeURIComponent(tx.chargePointId)}`);
                      } else {
                        navigate(`${opsBase}/sessions/${tx.transactionId}`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={
                      tx.recordPending
                        ? `Open device ${tx.chargePointId}`
                        : `Open session ${tx.transactionId}`
                    }
                  >
                    <TableCell>
                      {tx.recordPending ? 'Pending sync' : tx.transactionId}
                    </TableCell>
                    <TableCell>{tx.chargePointId}</TableCell>
                    <TableCell>{tx.connectorId}</TableCell>
                    <TableCell>{tx.idTag || '-'}</TableCell>
                    <TableCell>
                      {new Date(tx.startTime).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {tx.durationMinutes !== undefined
                        ? formatDurationMinutes(tx.durationMinutes)
                        : tx.status === 'Active'
                        ? 'In progress...'
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {formatEnergyKwh(tx.totalEnergyKwh, 3)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(tx.totalCost, 'GHS')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tx.recordPending ? 'Active (connector)' : tx.status}
                        color={getTransactionStatusColor(tx.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        </Box>
      </Paper>
    </Box>
  );
}

