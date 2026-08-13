import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Pagination,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { useCustomerPullRefresh } from '../../contexts/CustomerPullRefreshContext';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { walletApi, WalletBalance, WalletTransaction } from '../../services/walletApi';
import { paymentsApi } from '../../services/paymentsApi';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';
import { getStoredUser } from '../../utils/authSession';
import { formatCurrency } from '../../utils/formatters';
import { getPaymentStatusColor, getWalletTransactionTypeColor } from '../../utils/statusColors';
import {
  formatWalletLedgerAmount,
  formatWalletLedgerTypeLabel,
  walletLedgerAmountColor,
} from '../../utils/walletLedgerDisplay';
import { buildWalletActivitySeries } from '../../utils/walletActivitySeries';
import { CUSTOMER_ROUTES } from '../../config/customerNav.paths';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { CustomerChromeSkeleton } from '../../components/dashboard/CustomerChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';
import { triggerHaptic } from '../../utils/haptics';
import { MobileListLoadMore } from '../../components/ios/MobileListLoadMore';
import { UserErrorAlert } from '../../components/UserErrorAlert';
import { formatUserFacingErrorMessage, UserMessages } from '../../utils/userFriendlyErrors';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { AppBadge, chipColorToBadgeTone } from '../../components/ui/AppBadge';
import { CustomerWalletBalanceHero } from '../../components/customer/CustomerWalletBalanceHero';

const WALLET_TX_PAGE_SIZE = 20;
const ACTIVITY_DAYS = 14;

export function CustomerWalletPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [funds, setFunds] = useState<{
    available: number;
    reserved: number;
    total: number;
    currency: string;
  } | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [loadingMoreTx, setLoadingMoreTx] = useState(false);
  const { loading, refreshing, updatedAt, runWithRefresh } = useLiveRefresh();
  const [error, setError] = useState<string | null>(null);

  const fetchTransactionsPage = useCallback(async (userId: number, pageNum: number, append: boolean) => {
    const offset = (pageNum - 1) * WALLET_TX_PAGE_SIZE;
    const transactionsData = await walletApi.getTransactions(userId, WALLET_TX_PAGE_SIZE, offset);
    setTransactions((prev) =>
      append ? [...prev, ...transactionsData.transactions] : transactionsData.transactions,
    );
    setTxTotal(transactionsData.total);
    setTxPage(pageNum);
  }, []);

  const loadWalletData = useCallback(
    async (silent?: boolean) => {
      await runWithRefresh(async () => {
        try {
          setError(null);
          const user = getStoredUser();
          if (typeof user?.id !== 'number') {
            setError(UserMessages.notSignedIn);
            return false;
          }
          const [balanceData, availableData] = await Promise.all([
            walletApi.getBalance(user.id),
            walletApi.getAvailableBalance(user.id),
          ]);
          setBalance(balanceData);
          setFunds(availableData);
          setTxPage(1);
          await fetchTransactionsPage(user.id, 1, false);
          return true;
        } catch (err: unknown) {
          setError(formatUserFacingErrorMessage(err, 'wallet'));
          console.error('Error loading wallet data:', err);
          return false;
        }
      }, silent);
    },
    [fetchTransactionsPage, runWithRefresh],
  );

  const handleLoadMoreTransactions = useCallback(async () => {
    const user = getStoredUser();
    if (typeof user?.id !== 'number' || loadingMoreTx || txPage * WALLET_TX_PAGE_SIZE >= txTotal) {
      return;
    }
    setLoadingMoreTx(true);
    try {
      setError(null);
      await fetchTransactionsPage(user.id, txPage + 1, true);
    } catch (err: unknown) {
      setError(formatUserFacingErrorMessage(err, 'wallet'));
    } finally {
      setLoadingMoreTx(false);
    }
  }, [fetchTransactionsPage, loadingMoreTx, txPage, txTotal]);

  const handleDesktopTxPageChange = useCallback(
    async (_: unknown, value: number) => {
      const user = getStoredUser();
      if (typeof user?.id !== 'number') return;
      setTxPage(value);
      try {
        setError(null);
        await fetchTransactionsPage(user.id, value, false);
      } catch (err: unknown) {
        setError(formatUserFacingErrorMessage(err, 'wallet'));
      }
    },
    [fetchTransactionsPage],
  );

  useEffect(() => {
    void loadWalletData();
  }, [loadWalletData]);

  const paystackReturnRef = searchParams.get('reference') || searchParams.get('trxref') || '';

  useEffect(() => {
    if (!paystackReturnRef) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await paymentsApi.verifyPayment(paystackReturnRef);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(formatUserFacingErrorMessage(err, 'payments'));
        }
      } finally {
        if (!cancelled) {
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.delete('reference');
              next.delete('trxref');
              return next;
            },
            { replace: true },
          );
          void loadWalletData(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadWalletData, paystackReturnRef, setSearchParams]);

  useCustomerPullRefresh(useCallback(() => void loadWalletData(true), [loadWalletData]));

  const activity = useMemo(
    () => buildWalletActivitySeries(transactions, ACTIVITY_DAYS),
    [transactions],
  );

  const goTopUp = useCallback(() => {
    navigate(CUSTOMER_ROUTES.walletTopUp);
  }, [navigate]);

  if (loading && balance === null) {
    return <CustomerChromeSkeleton preset="wallet" />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Wallet"
        subtitle="Balance and history"
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.wallet}
        refreshing={refreshing}
        onRefresh={() => void loadWalletData(true)}
        titleVariant="large"
      />

      {error && (
        <UserErrorAlert error={error} context="wallet" sx={{ mb: 2 }} onClose={() => setError(null)} />
      )}

      {funds ? (
        <CustomerWalletBalanceHero
          funds={funds}
          activityValues={activity.values}
          periodSpend={activity.periodSpend}
          periodDays={ACTIVITY_DAYS}
          onTopUp={goTopUp}
        />
      ) : null}

      {useGroupedList ? (
        <Box sx={{ position: 'relative' }}>
          <TableSurfaceProgress active={loading && balance !== null} ariaLabel="Loading wallet transactions" />
          {transactions.length === 0 ? (
            <AppEmptyState
              variant="plain"
              icon={<AccountBalanceWalletOutlinedIcon />}
              title="No activity yet"
              description="Top up to start charging. Your ledger appears here."
              primaryAction={{
                label: 'Top up',
                onClick: () => {
                  triggerHaptic('light');
                  goTopUp();
                },
              }}
            />
          ) : (
            <GroupedListSection title="Transaction history">
              {transactions.map((tx, index) => (
                <GroupedListRow
                  key={tx.id}
                  divider={index < transactions.length - 1}
                  showChevron={false}
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flexWrap: 'wrap' }}>
                      <Typography component="span" sx={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                        {tx.description || formatWalletLedgerTypeLabel(tx.type)}
                      </Typography>
                      <AppBadge
                        label={tx.status}
                        tone={chipColorToBadgeTone(getPaymentStatusColor(tx.status))}
                        size="small"
                      />
                    </Box>
                  }
                  secondary={`${new Date(tx.createdAt).toLocaleDateString()} · ${formatWalletLedgerTypeLabel(tx.type)}`}
                  end={
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: walletLedgerAmountColor(tx.type),
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {formatWalletLedgerAmount(tx)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Bal. {formatCurrency(tx.balanceAfter)}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </GroupedListSection>
          )}
          <MobileListLoadMore
            page={txPage}
            totalCount={txTotal}
            pageSize={WALLET_TX_PAGE_SIZE}
            loading={loadingMoreTx}
            onLoadMore={() => void handleLoadMoreTransactions()}
          />
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
                    <TableCell colSpan={6} sx={{ border: 0, p: 0 }}>
                      <AppEmptyState
                        variant="plain"
                        icon={<AccountBalanceWalletOutlinedIcon />}
                        title="No activity yet"
                        description="Top up to start charging. Your ledger appears here."
                        primaryAction={{
                          label: 'Top up',
                          onClick: () => {
                            triggerHaptic('light');
                            goTopUp();
                          },
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <AppBadge
                          label={formatWalletLedgerTypeLabel(tx.type)}
                          tone={chipColorToBadgeTone(getWalletTransactionTypeColor(tx.type))}
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
                        <AppBadge label={tx.status} tone={chipColorToBadgeTone(getPaymentStatusColor(tx.status))} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {txTotal > WALLET_TX_PAGE_SIZE && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <Pagination
                count={Math.ceil(txTotal / WALLET_TX_PAGE_SIZE)}
                page={txPage}
                onChange={(_, value) => void handleDesktopTxPageChange(_, value)}
                color="primary"
              />
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}
