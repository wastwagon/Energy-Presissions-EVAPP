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
} from '@mui/material';
import { useOpsBasePath } from '../../hooks/useOpsBasePath';
import { transactionsApi, Transaction } from '../../services/transactionsApi';
import { websocketService } from '../../services/websocket';
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumTableSurfaceSx } from '../../theme/jampackShell';
import { formatCurrency, formatDurationMinutes, formatEnergyKwh } from '../../utils/formatters';
import { getTransactionStatusColor } from '../../utils/statusColors';
import { OpsQuickActions } from '../../components/dashboard/OpsQuickActions';

export function SessionsPage() {
  const navigate = useNavigate();
  const opsBase = useOpsBasePath();
  const [activeTab, setActiveTab] = useState(0);
  const [activeTransactions, setActiveTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleSessionRowKeyDown =
    (transactionId: string | number) => (event: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        navigate(`${opsBase}/sessions/${transactionId}`);
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
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
          Charging Sessions
        </Typography>
        <Typography variant="body2" sx={dashboardPageSubtitleSx}>
          View active sessions and transaction history across your network.
        </Typography>
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
        >
          <Tab label={`Active (${activeTransactions.length})`} />
          <Tab label={`All sessions (${allTransactions.length})`} />
        </Tabs>

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
                    key={tx.transactionId}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`${opsBase}/sessions/${tx.transactionId}`)}
                    onKeyDown={handleSessionRowKeyDown(tx.transactionId)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open session ${tx.transactionId}`}
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
                        label={tx.status}
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
      </Paper>
    </Box>
  );
}

