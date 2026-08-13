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
  Button,
  Pagination,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { MobileListLoadMore } from '../../components/ios/MobileListLoadMore';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { useCustomerPullRefresh } from '../../contexts/CustomerPullRefreshContext';
import { transactionsApi, Transaction } from '../../services/transactionsApi';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';
import { compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { getStoredUser } from '../../utils/authSession';
import { CUSTOMER_ROUTES } from '../../config/customerNav.paths';
import {
  formatSessionCost,
  formatSessionDuration,
  formatSessionEnergy,
  sessionStatusChipColor,
  sessionStatusLabel,
} from '../../utils/sessionDisplay';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { AppBadge, chipColorToBadgeTone } from '../../components/ui/AppBadge';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { CustomerChromeSkeleton } from '../../components/dashboard/CustomerChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';
import { UserErrorAlert } from '../../components/UserErrorAlert';
import { formatUserFacingErrorMessage, UserMessages } from '../../utils/userFriendlyErrors';
import { triggerHaptic } from '../../utils/haptics';

export function CustomerSessionHistoryPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { loading, refreshing, updatedAt, runWithRefresh } = useLiveRefresh();
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 20;

  const fetchHistoryPage = useCallback(async (pageNum: number, append: boolean) => {
    const user = getStoredUser();
    if (typeof user?.id !== 'number') {
      setError(UserMessages.notSignedIn);
      return false;
    }
    const offset = (pageNum - 1) * limit;
    const response = await transactionsApi.getAll(limit, offset, undefined, undefined, user.id);
    setTransactions((prev) => (append ? [...prev, ...response.transactions] : response.transactions));
    setTotal(response.total);
    setPage(pageNum);
    return true;
  }, []);

  const loadHistory = useCallback(
    async (silent?: boolean) => {
      await runWithRefresh(async () => {
        try {
          setError(null);
          return await fetchHistoryPage(1, false);
        } catch (err: unknown) {
          setError(formatUserFacingErrorMessage(err, 'sessions'));
          console.error('Error loading session history:', err);
          return false;
        }
      }, silent);
    },
    [fetchHistoryPage, runWithRefresh],
  );

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || page * limit >= total) return;
    setLoadingMore(true);
    try {
      setError(null);
      await fetchHistoryPage(page + 1, true);
    } catch (err: unknown) {
      setError(formatUserFacingErrorMessage(err, 'sessions'));
    } finally {
      setLoadingMore(false);
    }
  }, [fetchHistoryPage, loadingMore, page, total, limit]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useCustomerPullRefresh(useCallback(() => void loadHistory(true), [loadHistory]));

  if (loading && transactions.length === 0) {
    return <CustomerChromeSkeleton preset="sessionHistory" />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Session History"
        subtitle="View all your past charging sessions"
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.history}
        refreshing={refreshing}
        onRefresh={() => void loadHistory(true)}
        titleVariant="large"
      />

      {error && (
        <UserErrorAlert error={error} context="sessions" sx={{ mb: 3 }} onClose={() => setError(null)} />
      )}

      {transactions.length === 0 ? (
        <AppEmptyState
          variant="plain"
          icon={<HistoryOutlinedIcon />}
          title="No sessions yet"
          description="Completed charges appear here after your first plug-in."
          primaryAction={{
            label: 'Find a charger',
            onClick: () => {
              triggerHaptic('light');
              navigate(CUSTOMER_ROUTES.stations);
            },
          }}
        />
      ) : useGroupedList ? (
        <>
          <TableSurfaceProgress active={loading && transactions.length > 0} ariaLabel="Loading session history" />
          <GroupedListSection title="Past sessions">
            {transactions.map((tx, index) => (
              <GroupedListRow
                key={tx.id}
                divider={index < transactions.length - 1}
                primary={tx.locationName || tx.chargePointId}
                secondary={`${new Date(tx.startTime).toLocaleDateString()} · ${formatSessionEnergy(tx)} · ${formatSessionDuration(tx)}`}
                end={
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatSessionCost(tx)}
                    </Typography>
                    <AppBadge
                      label={sessionStatusLabel(tx)}
                      tone={chipColorToBadgeTone(sessionStatusChipColor(sessionStatusLabel(tx)))}
                      sx={{ mt: 0.5, height: 22 }}
                    />
                  </Box>
                }
                onClick={() => navigate(`${CUSTOMER_ROUTES.sessionsRoot}/${tx.transactionId}`)}
                aria-label={`View session ${tx.transactionId}`}
              />
            ))}
          </GroupedListSection>
          <MobileListLoadMore
            page={page}
            totalCount={total}
            pageSize={limit}
            loading={loadingMore}
            onLoadMore={() => void handleLoadMore()}
          />
        </>
      ) : (
        <>
          <Paper elevation={0} sx={{ ...premiumTableSurfaceSx, position: 'relative' }}>
            <TableSurfaceProgress active={loading && transactions.length > 0} ariaLabel="Loading session history" />
            <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Past sessions
              </Typography>
            </Box>
            <TableContainer sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Charge Point</TableCell>
                  <TableCell>Energy (kWh)</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell>{tx.transactionId}</TableCell>
                    <TableCell>{tx.chargePointId}</TableCell>
                    <TableCell>{formatSessionEnergy(tx)}</TableCell>
                    <TableCell>{formatSessionDuration(tx)}</TableCell>
                    <TableCell>{formatSessionCost(tx)}</TableCell>
                    <TableCell>
                      <AppBadge
                        label={sessionStatusLabel(tx)}
                        tone={chipColorToBadgeTone(sessionStatusChipColor(sessionStatusLabel(tx)))}
                      />
                    </TableCell>
                    <TableCell>{new Date(tx.startTime).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        disableElevation
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`${CUSTOMER_ROUTES.sessionsRoot}/${tx.transactionId}`)}
                        sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), minWidth: 0, px: 1.5 })}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          </Paper>
          {total > limit && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(total / limit)}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

