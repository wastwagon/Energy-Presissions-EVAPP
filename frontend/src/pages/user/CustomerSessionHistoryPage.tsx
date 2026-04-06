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
  Pagination,
} from '@mui/material';
import { transactionsApi, Transaction } from '../../services/transactionsApi';
import HistoryIcon from '@mui/icons-material/History';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { CustomerQuickActions } from '../../components/dashboard/CustomerQuickActions';
import {
  dashboardPageTitleSx,
  dashboardPageSubtitleSx,
  premiumEmptyStatePaperSx,
  premiumTableSurfaceSx,
} from '../../theme/jampackShell';
import { compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { getStoredUser } from '../../utils/authSession';
import { formatCurrency, formatDurationMinutes, formatEnergyKwh } from '../../utils/formatters';
import { getTransactionStatusColor } from '../../utils/statusColors';

export function CustomerSessionHistoryPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = getStoredUser();
      if (typeof user?.id !== 'number') {
        setError('User not logged in');
        return;
      }
      const offset = (page - 1) * limit;
      const response = await transactionsApi.getAll(limit, offset, undefined, undefined, user.id);
      setTransactions(response.transactions);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load session history');
      console.error('Error loading session history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
          Session History
        </Typography>
        <Typography variant="body2" sx={dashboardPageSubtitleSx}>
          View all your past charging sessions
        </Typography>
      </Box>

      <CustomerQuickActions preset="sessions_history" />

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
      ) : (
        <>
          <Paper elevation={0} sx={premiumTableSurfaceSx}>
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
                    <TableCell>{formatEnergyKwh(tx.totalEnergyKwh)}</TableCell>
                    <TableCell>{formatDurationMinutes(tx.durationMinutes)}</TableCell>
                    <TableCell>{formatCurrency(tx.totalCost, 'GHS')}</TableCell>
                    <TableCell>
                      <Chip label={tx.status} color={getTransactionStatusColor(tx.status)} size="small" />
                    </TableCell>
                    <TableCell>{new Date(tx.startTime).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        disableElevation
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`/user/sessions/${tx.transactionId}`)}
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

