import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { StaffFilterBar } from '../../components/dashboard/StaffFilterBar';
import { StaffStatusTabs } from '../../components/dashboard/StaffStatusTabs';
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

type SessionStatusTab = 'active' | 'all' | 'completed' | 'other';

function isCompletedSession(tx: Transaction): boolean {
  const status = (tx.status || '').toLowerCase();
  return status === 'completed' || status === 'succeeded';
}

function isOtherSession(tx: Transaction): boolean {
  if (tx.recordPending) return false;
  const status = (tx.status || '').toLowerCase();
  return status !== 'active' && !isCompletedSession(tx);
}

export function SessionsPage() {
  const navigate = useNavigate();
  const opsBase = useOpsBasePath();
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [statusTab, setStatusTab] = useState<SessionStatusTab>('active');
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
      if (statusTab === 'active') {
        void loadActiveTransactions();
      }
    }, 10000);

    return () => {
      unsubscribeTransactionStarted();
      unsubscribeTransactionStopped();
      clearInterval(interval);
    };
  }, [statusTab, loadTransactions, loadActiveTransactions]);

  useStaffPullRefresh(useCallback(() => void loadTransactions(true), [loadTransactions]));

  const completedOnPage = useMemo(
    () => allTransactions.filter((tx) => isCompletedSession(tx)),
    [allTransactions],
  );
  const otherOnPage = useMemo(() => allTransactions.filter((tx) => isOtherSession(tx)), [allTransactions]);

  const transactions = useMemo(() => {
    if (statusTab === 'active') return activeTransactions;
    if (statusTab === 'completed') return completedOnPage;
    if (statusTab === 'other') return otherOnPage;
    return allTransactions;
  }, [statusTab, activeTransactions, allTransactions, completedOnPage, otherOnPage]);

  const showAllPaging = statusTab === 'all';

  const openSession = (tx: Transaction) => {
    if (tx.recordPending) {
      navigate(`${opsBase}/devices/${encodeURIComponent(tx.chargePointId)}`);
    } else {
      navigate(`${opsBase}/sessions/${tx.transactionId}`);
    }
  };

  const emptyCopy = (() => {
    switch (statusTab) {
      case 'active':
        return {
          title: 'No active charging sessions',
          description: 'Live sessions will appear here when drivers start charging.',
        };
      case 'completed':
        return {
          title: 'No completed sessions on this page',
          description: 'Completed sessions from the current history page will show here.',
        };
      case 'other':
        return {
          title: 'No other sessions on this page',
          description: 'Failed, cancelled, or other statuses from the current history page appear here.',
        };
      default:
        return {
          title: 'No transactions found',
          description: 'Completed and historical sessions will show up once activity begins.',
        };
    }
  })();

  const renderSessionRows = () => {
    if (transactions.length === 0) {
      return (
        <AppEmptyState
          sx={{ border: 0, boxShadow: 'none', borderRadius: 0 }}
          icon={<EvStationIcon />}
          title={emptyCopy.title}
          description={emptyCopy.description}
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
          {showAllPaging && (
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
        {showAllPaging && allTotal > ALL_SESSIONS_PAGE_SIZE && (
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

      <StaffFilterBar aria-label="Session status filters">
        <StaffStatusTabs
          aria-label="Session status"
          value={statusTab}
          onChange={setStatusTab}
          options={[
            { value: 'active', label: 'Active', count: activeTransactions.length },
            { value: 'all', label: 'All', count: allTotal },
            { value: 'completed', label: 'Completed', count: completedOnPage.length },
            { value: 'other', label: 'Other', count: otherOnPage.length },
          ]}
        />
      </StaffFilterBar>

      <Paper elevation={0} sx={{ ...premiumTableSurfaceSx, mt: 0 }}>
        <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.5, sm: 1.75 }, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {statusTab === 'active'
              ? 'Active sessions'
              : statusTab === 'completed'
                ? 'Completed (this page)'
                : statusTab === 'other'
                  ? 'Other statuses (this page)'
                  : 'All sessions'}
          </Typography>
        </Box>
        {renderSessionRows()}
      </Paper>
    </Box>
  );
}
