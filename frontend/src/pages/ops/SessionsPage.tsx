import { useState, useEffect, useCallback } from 'react';
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
  Alert,
  Tabs,
  Tab,
  Pagination,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import EvStationIcon from '@mui/icons-material/EvStation';
import { useOpsBasePath } from '../../hooks/useOpsBasePath';
import { transactionsApi, Transaction } from '../../services/transactionsApi';
import { websocketService } from '../../services/websocket';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';
import { getTransactionStatusColor } from '../../utils/statusColors';
import {
  formatCustomerDisplayName,
  formatSessionCost,
  formatSessionDuration,
  formatSessionEnergy,
  sessionStatusChipColor,
  sessionStatusLabel,
} from '../../utils/sessionDisplay';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { AppBadge, chipColorToBadgeTone } from '../../components/ui/AppBadge';
import { useStaffPullRefresh } from '../../hooks/useStaffPullRefresh';
import { staffLargeSubtitleSx, staffLargeTitleSx } from '../../theme/staffChrome';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { DashboardStaffChromeSkeleton } from '../../components/dashboard/DashboardStaffChromeSkeleton';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { MobileListLoadMore } from '../../components/ios/MobileListLoadMore';

const ALL_SESSIONS_PAGE_SIZE = 20;

export function SessionsPage() {
  const navigate = useNavigate();
  const opsBase = useOpsBasePath();
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [activeTransactions, setActiveTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allPage, setAllPage] = useState(1);
  const [allTotal, setAllTotal] = useState(0);
  const [loadingMoreAll, setLoadingMoreAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const fetchAllSessionsPage = useCallback(async (pageNum: number, append: boolean) => {
    const offset = (pageNum - 1) * ALL_SESSIONS_PAGE_SIZE;
    const res = await transactionsApi.getAll(ALL_SESSIONS_PAGE_SIZE, offset);
    setAllTransactions((prev) => (append ? [...prev, ...res.transactions] : res.transactions));
    setAllTotal(res.total);
    setAllPage(pageNum);
  }, []);

  const loadTransactions = useCallback(
    async (silent?: boolean) => {
      const isQuiet = silent === true;
      try {
        if (isQuiet) setRefreshing(true);
        setError(null);
        const active = await transactionsApi.getActive();
        setActiveTransactions(active);
        setAllPage(1);
        await fetchAllSessionsPage(1, false);
        setUpdatedAt(Date.now());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
        console.error('Error loading transactions:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchAllSessionsPage],
  );

  const loadActiveTransactions = useCallback(async () => {
    try {
      const active = await transactionsApi.getActive();
      setActiveTransactions(active);
      setUpdatedAt(Date.now());
    } catch (err: unknown) {
      console.error('Error loading active transactions:', err);
    }
  }, []);

  const handleLoadMoreAll = useCallback(async () => {
    if (loadingMoreAll || allPage * ALL_SESSIONS_PAGE_SIZE >= allTotal) return;
    setLoadingMoreAll(true);
    try {
      setError(null);
      await fetchAllSessionsPage(allPage + 1, true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load more sessions');
    } finally {
      setLoadingMoreAll(false);
    }
  }, [allPage, allTotal, fetchAllSessionsPage, loadingMoreAll]);

  const handleDesktopAllPageChange = useCallback(
    async (_: unknown, value: number) => {
      try {
        setError(null);
        await fetchAllSessionsPage(value, false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      }
    },
    [fetchAllSessionsPage],
  );

  useEffect(() => {
    void loadTransactions();

    const unsubscribeTransactionStarted = websocketService.on('transactionStarted', () => {
      void loadTransactions();
    });

    const unsubscribeTransactionStopped = websocketService.on('transactionStopped', () => {
      void loadTransactions();
    });

    const interval = setInterval(() => {
      if (activeTab === 0) {
        void loadActiveTransactions();
      }
    }, 10000);

    return () => {
      unsubscribeTransactionStarted();
      unsubscribeTransactionStopped();
      clearInterval(interval);
    };
  }, [activeTab, loadTransactions, loadActiveTransactions]);

  const transactions = activeTab === 0 ? activeTransactions : allTransactions;

  const openSession = (tx: Transaction) => {
    if (tx.recordPending) {
      navigate(`${opsBase}/devices/${encodeURIComponent(tx.chargePointId)}`);
    } else {
      navigate(`${opsBase}/sessions/${tx.transactionId}`);
    }
  };

  const renderSessionRows = () => {
    if (transactions.length === 0) {
      return (
        <AppEmptyState
          sx={{ border: 0, boxShadow: 'none', borderRadius: 0 }}
          icon={<EvStationIcon />}
          title={activeTab === 0 ? 'No active charging sessions' : 'No transactions found'}
          description={
            activeTab === 0
              ? 'Live sessions will appear here when drivers start charging.'
              : 'Completed and historical sessions will show up once activity begins.'
          }
        />
      );
    }

    if (useGroupedList) {
      return (
        <Box sx={{ py: 1 }}>
          <GroupedListSection>
            {transactions.map((tx, index) => (
              <GroupedListRow
                key={`${tx.chargePointId}-${tx.connectorId}-${tx.transactionId}-${tx.id}`}
                divider={index < transactions.length - 1}
                primary={formatCustomerDisplayName(tx)}
                secondary={`${tx.chargePointId} · ${formatSessionEnergy(tx)} · ${formatSessionDuration(tx)}`}
                end={
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatSessionCost(tx)}
                    </Typography>
                    <AppBadge
                      label={tx.recordPending ? 'Active (connector)' : sessionStatusLabel(tx)}
                      tone={chipColorToBadgeTone(
                        tx.recordPending
                          ? getTransactionStatusColor('Active')
                          : sessionStatusChipColor(sessionStatusLabel(tx)),
                      )}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                }
                onClick={() => openSession(tx)}
                aria-label={
                  tx.recordPending
                    ? `Open device ${tx.chargePointId}`
                    : `Open session ${tx.transactionId}`
                }
              />
            ))}
          </GroupedListSection>
          {activeTab === 1 && (
            <MobileListLoadMore
              page={allPage}
              totalCount={allTotal}
              pageSize={ALL_SESSIONS_PAGE_SIZE}
              loading={loadingMoreAll}
              onLoadMore={() => void handleLoadMoreAll()}
            />
          )}
        </Box>
      );
    }

    return (
      <>
        <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Charge Point</TableCell>
                <TableCell>Connector</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Energy</TableCell>
                <TableCell>Cost</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow
                  key={`${tx.chargePointId}-${tx.connectorId}-${tx.transactionId}-${tx.id}`}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => openSession(tx)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' && e.key !== ' ') return;
                    e.preventDefault();
                    openSession(tx);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={
                    tx.recordPending
                      ? `Open device ${tx.chargePointId}`
                      : `Open session ${tx.transactionId}`
                  }
                >
                  <TableCell>{tx.recordPending ? 'Pending sync' : tx.transactionId}</TableCell>
                  <TableCell>{formatCustomerDisplayName(tx)}</TableCell>
                  <TableCell>{tx.chargePointId}</TableCell>
                  <TableCell>{tx.connectorId}</TableCell>
                  <TableCell>{new Date(tx.startTime).toLocaleString()}</TableCell>
                  <TableCell>{formatSessionDuration(tx)}</TableCell>
                  <TableCell>{formatSessionEnergy(tx)}</TableCell>
                  <TableCell>{formatSessionCost(tx)}</TableCell>
                  <TableCell>
                    <AppBadge
                      label={tx.recordPending ? 'Active (connector)' : sessionStatusLabel(tx)}
                      tone={chipColorToBadgeTone(
                        tx.recordPending
                          ? getTransactionStatusColor('Active')
                          : sessionStatusChipColor(sessionStatusLabel(tx)),
                      )}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {activeTab === 1 && allTotal > ALL_SESSIONS_PAGE_SIZE && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <Pagination
              count={Math.ceil(allTotal / ALL_SESSIONS_PAGE_SIZE)}
              page={allPage}
              onChange={(_, value) => void handleDesktopAllPageChange(_, value)}
              color="primary"
            />
          </Box>
        )}
      </>
    );
  };

  if (loading) {
    return <DashboardStaffChromeSkeleton preset="sessions" />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Charging Sessions"
        subtitle="View active sessions and transaction history across your network"
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.sessions}
        showSeconds
        refreshing={refreshing}
        onRefresh={() => void loadTransactions(true)}
        titleVariant="large"
        titleSx={staffLargeTitleSx}
        subtitleSx={staffLargeSubtitleSx}
        showToolbarRefreshOnMobile
        containerSx={{ mb: 2 }}
      />

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
          <Tab
            label={`All sessions (${allTotal})`}
            id="ops-sessions-tab-1"
            aria-controls="ops-sessions-panel-1"
          />
        </Tabs>

        <Box role="tabpanel" id={`ops-sessions-panel-${activeTab}`} aria-labelledby={`ops-sessions-tab-${activeTab}`}>
          {renderSessionRows()}
        </Box>
      </Paper>
    </Box>
  );
}
