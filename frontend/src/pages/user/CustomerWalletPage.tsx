import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { useCustomerPullRefresh } from '../../contexts/CustomerPullRefreshContext';
import { alpha } from '@mui/material/styles';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/Add';
import { walletApi, WalletBalance, WalletTransaction } from '../../services/walletApi';
import { premiumPanelCardSx, premiumTableSurfaceSx } from '../../theme/jampackShell';
import { compactContainedCtaSx, sxObject } from '../../styles/authShell';
import { getStoredUser } from '../../utils/authSession';
import { formatCurrency } from '../../utils/formatters';
import { getPaymentStatusColor, getWalletTransactionTypeColor } from '../../utils/statusColors';
import {
  formatWalletLedgerAmount,
  formatWalletLedgerTypeLabel,
  walletLedgerAmountColor,
} from '../../utils/walletLedgerDisplay';
import { GroupedDetailRow } from '../../components/ios/GroupedDetailRow';
import { CUSTOMER_ROUTES } from '../../config/customerNav.paths';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { CustomerChromeSkeleton } from '../../components/dashboard/CustomerChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';
import { triggerHaptic } from '../../utils/haptics';

export function CustomerWalletPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [funds, setFunds] = useState<{ available: number; reserved: number; total: number; currency: string } | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const { loading, refreshing, updatedAt, runWithRefresh } = useLiveRefresh();
  const [error, setError] = useState<string | null>(null);

  const loadWalletData = useCallback(async (silent?: boolean) => {
    await runWithRefresh(async () => {
      try {
        setError(null);
        const user = getStoredUser();
        if (typeof user?.id !== 'number') {
          setError('User not logged in');
          return false;
        }
        const [balanceData, availableData, transactionsData] = await Promise.all([
          walletApi.getBalance(user.id),
          walletApi.getAvailableBalance(user.id),
          walletApi.getTransactions(user.id, 20, 0),
        ]);
        setBalance(balanceData);
        setFunds(availableData);
        setTransactions(transactionsData.transactions);
        return true;
      } catch (err: any) {
        setError(err.message || 'Failed to load wallet data');
        console.error('Error loading wallet data:', err);
        return false;
      }
    }, silent);
  }, [runWithRefresh]);

  useEffect(() => {
    void loadWalletData();
  }, [loadWalletData]);

  useCustomerPullRefresh(useCallback(() => void loadWalletData(true), [loadWalletData]));

  if (loading && balance === null) {
    return <CustomerChromeSkeleton preset="wallet" />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Wallet"
        subtitle="Manage your wallet balance and view transaction history"
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.wallet}
        refreshing={refreshing}
        onRefresh={() => void loadWalletData(true)}
        titleVariant="large"
      />
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          disableElevation
          startIcon={<AddIcon />}
          onClick={() => {
            triggerHaptic('light');
            navigate(CUSTOMER_ROUTES.walletTopUp);
          }}
          sx={(th) => ({
            ...sxObject(th, compactContainedCtaSx),
            width: { xs: '100%', sm: 'auto' },
          })}
        >
          Top Up Wallet
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {balance && funds && (
        <Box sx={{ mb: 3 }}>
          <Paper
            elevation={0}
            sx={(th) => ({
              ...premiumPanelCardSx,
              mb: 2,
              background: `linear-gradient(135deg, ${alpha(th.palette.primary.main, 0.07)} 0%, ${alpha(
                th.palette.primary.main,
                0.02,
              )} 100%)`,
              borderColor: alpha(th.palette.primary.main, 0.18),
            })}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box
                sx={(th) => ({
                  width: 52,
                  height: 52,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  bgcolor: alpha(th.palette.primary.main, 0.12),
                  color: 'primary.main',
                })}
              >
                <AccountBalanceWalletIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}
                >
                  Available to spend
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: 'text.primary',
                    fontSize: { xs: '1.75rem', sm: '2.25rem' },
                    wordBreak: 'break-word',
                    lineHeight: 1.2,
                    mt: 0.25,
                  }}
                >
                  {formatCurrency(funds.available, funds.currency)}
                </Typography>
              </Box>
            </Box>
          </Paper>
          <GroupedListSection title="Balance">
            <GroupedDetailRow
              label="Available"
              value={
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatCurrency(funds.available, funds.currency)}
                </Typography>
              }
              divider
            />
            <GroupedDetailRow
              label="On hold"
              value={
                <Typography variant="body2" sx={{ fontWeight: 600, color: funds.reserved > 0 ? 'warning.main' : 'text.primary' }}>
                  {formatCurrency(funds.reserved, funds.currency)}
                </Typography>
              }
              divider
            />
            <GroupedDetailRow
              label="Wallet total"
              value={
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatCurrency(funds.total, funds.currency)}
                </Typography>
              }
            />
          </GroupedListSection>
        </Box>
      )}

      {useGroupedList ? (
        <Box sx={{ position: 'relative' }}>
          <TableSurfaceProgress active={loading && balance !== null} ariaLabel="Loading wallet transactions" />
          {transactions.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No transactions yet
            </Typography>
          ) : (
            <GroupedListSection title="Transaction history">
              {transactions.map((tx, index) => (
                <GroupedListRow
                  key={tx.id}
                  divider={index < transactions.length - 1}
                  showChevron={false}
                  primary={tx.description || formatWalletLedgerTypeLabel(tx.type)}
                  secondary={`${new Date(tx.createdAt).toLocaleDateString()} · ${tx.status}`}
                  end={
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: walletLedgerAmountColor(tx.type),
                        }}
                      >
                        {formatWalletLedgerAmount(tx)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatCurrency(tx.balanceAfter)}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </GroupedListSection>
          )}
        </Box>
      ) : (
        <Paper elevation={0} sx={{ ...premiumTableSurfaceSx, position: 'relative' }}>
          <TableSurfaceProgress active={loading && balance !== null} ariaLabel="Loading wallet transactions" />
          <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Transaction history
            </Typography>
          </Box>
          <TableContainer sx={{ width: '100%', maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Balance After</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No transactions yet
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={formatWalletLedgerTypeLabel(tx.type)}
                          color={getWalletTransactionTypeColor(tx.type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{tx.description || '-'}</TableCell>
                      <TableCell
                        sx={{
                          color: walletLedgerAmountColor(tx.type),
                          fontWeight: 600,
                        }}
                      >
                        {formatWalletLedgerAmount(tx)}
                      </TableCell>
                      <TableCell>{formatCurrency(tx.balanceAfter)}</TableCell>
                      <TableCell>
                        <Chip label={tx.status} color={getPaymentStatusColor(tx.status)} size="small" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}

