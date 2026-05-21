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
  Chip,
  Alert,
  Button,
  Pagination,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { useCustomerPullRefresh } from '../../contexts/CustomerPullRefreshContext';
import { transactionsApi, Transaction } from '../../services/transactionsApi';
import HistoryIcon from '@mui/icons-material/History';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { premiumEmptyStatePaperSx, premiumTableSurfaceSx } from '../../theme/jampackShell';
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
import { CustomerChromeSkeleton } from '../../components/dashboard/CustomerChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';

export function CustomerSessionHistoryPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { loading, refreshing, updatedAt, runWithRefresh } = useLiveRefresh();
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const loadHistory = useCallback(async (silent?: boolean) => {
    await runWithRefresh(async () => {
      try {
        setError(null);
        const user = getStoredUser();
        if (typeof user?.id !== 'number') {
          setError('User not logged in');
          return false;
        }
        const offset = (page - 1) * limit;
        const response = await transactionsApi.getAll(limit, offset, undefined, undefined, user.id);
        setTransactions(response.transactions);
        setTotal(response.total);
        return true;
      } catch (err: any) {
        setError(err.message || 'Failed to load session history');
        console.error('Error loading session history:', err);
        return false;
      }
    }, silent);
  }, [page, runWithRefresh]);

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
            <HistoryIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            No session history
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You have not completed any charging sessions yet.
          </Typography>
        </Paper>
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
                    <Chip
                      label={sessionStatusLabel(tx)}
                      color={sessionStatusChipColor(sessionStatusLabel(tx))}
                      size="small"
                      sx={{ mt: 0.5, height: 22 }}
                    />
                  </Box>
                }
                onClick={() => navigate(`${CUSTOMER_ROUTES.sessionsRoot}/${tx.transactionId}`)}
                aria-label={`View session ${tx.transactionId}`}
              />
            ))}
          </GroupedListSection>
          {total > limit && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={Math.ceil(total / limit)}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                size="large"
              />
            </Box>
          )}
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
                      <Chip
                        label={sessionStatusLabel(tx)}
                        color={sessionStatusChipColor(sessionStatusLabel(tx))}
                        size="small"
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

