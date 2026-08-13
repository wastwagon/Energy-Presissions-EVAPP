import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';
import ClearIcon from '@mui/icons-material/Clear';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { usersApi, User } from '../../services/usersApi';
import { walletApi, WalletTransaction } from '../../services/walletApi';
import { premiumTableSurfaceSx } from '../../theme/jampackShell';
import {
  authFormFieldSx,
  staffFilterFieldSx,
  compactContainedCtaSx,
  compactErrorContainedCtaSx,
  compactOutlinedCtaSx,
  premiumDialogPaperSx,
  premiumIconButtonTouchSx,
  sxObject,
} from '../../styles/authShell';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { StaffFilterBar } from '../../components/dashboard/StaffFilterBar';
import { StaffStatusTabs } from '../../components/dashboard/StaffStatusTabs';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { AppBadge, chipColorToBadgeTone } from '../../components/ui/AppBadge';
import { formatCurrency } from '../../utils/formatters';
import { getWalletTransactionTypeColor } from '../../utils/statusColors';
import {
  formatWalletLedgerAmount,
  formatWalletLedgerTypeLabel,
  walletLedgerAmountColor,
} from '../../utils/walletLedgerDisplay';
import { DashboardStaffChromeSkeleton } from '../../components/dashboard/DashboardStaffChromeSkeleton';
import { TableSurfaceProgress } from '../../components/dashboard/TableSurfaceProgress';
import { GroupedListSection } from '../../components/ios/GroupedListSection';
import { GroupedListRow } from '../../components/ios/GroupedListRow';
import { MobileListLoadMore } from '../../components/ios/MobileListLoadMore';
import { staffLargeSubtitleSx, staffLargeTitleSx } from '../../theme/staffChrome';

const WALLET_TX_PAGE_SIZE = 20;

type WalletBalanceTab = 'all' | 'positive' | 'zero' | 'debt';

export function WalletManagementPage() {
  const theme = useTheme();
  const useGroupedList = useMediaQuery(theme.breakpoints.down('md'));
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [userFunds, setUserFunds] = useState<{
    available: number;
    reserved: number;
    total: number;
    currency: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceTab, setBalanceTab] = useState<WalletBalanceTab>('all');
  const [creditDebtDialogOpen, setCreditDebtDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [txTotal, setTxTotal] = useState(0);
  const [loadingMoreTx, setLoadingMoreTx] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    accountType: 'Customer',
    status: 'Active',
  });

  useEffect(() => {
    void loadUsers();
  }, []);

  const loadUsers = async (silent?: boolean) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserTxPage = useCallback(async (userId: number, pageNum: number, append: boolean) => {
    const offset = (pageNum - 1) * WALLET_TX_PAGE_SIZE;
    const { transactions, total } = await walletApi.getTransactions(userId, WALLET_TX_PAGE_SIZE, offset);
    setWalletTransactions((prev) => (append ? [...prev, ...transactions] : transactions));
    setTxTotal(total);
    setTxPage(pageNum);
  }, []);

  const loadUserTransactions = useCallback(
    async (userId: number) => {
      try {
        const funds = await walletApi.getAvailableBalance(userId);
        setUserFunds(funds);
        setTxPage(1);
        await fetchUserTxPage(userId, 1, false);
      } catch (err: unknown) {
        console.error('Error loading wallet transactions:', err);
        setUserFunds(null);
        setWalletTransactions([]);
        setTxTotal(0);
      }
    },
    [fetchUserTxPage],
  );

  const handleLoadMoreTransactions = useCallback(async () => {
    if (!selectedUser || loadingMoreTx || txPage * WALLET_TX_PAGE_SIZE >= txTotal) return;
    setLoadingMoreTx(true);
    try {
      await fetchUserTxPage(selectedUser.id, txPage + 1, true);
    } catch (err: unknown) {
      console.error('Error loading more wallet transactions:', err);
    } finally {
      setLoadingMoreTx(false);
    }
  }, [fetchUserTxPage, loadingMoreTx, selectedUser, txPage, txTotal]);

  const handleDesktopTxPageChange = useCallback(
    async (_: unknown, value: number) => {
      if (!selectedUser) return;
      await fetchUserTxPage(selectedUser.id, value, false);
    },
    [fetchUserTxPage, selectedUser],
  );

  const handleCreditDebt = async () => {
    if (!selectedUser || !amount || amount.trim() === '') {
      setError('Please enter an amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum === 0) {
      setError('Please enter a valid amount (cannot be zero)');
      return;
    }

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      if (amountNum > 0) {
        // Credit (Top Up)
        await walletApi.topUp(selectedUser.id, amountNum, note || 'Credit adjustment');
        setSuccess(`Successfully credited ${formatCurrency(amountNum, selectedUser.currency || 'GHS')} to wallet`);
      } else {
        // Debt (Negative adjustment)
        await walletApi.adjust(selectedUser.id, amountNum, note || 'Debt adjustment');
        setSuccess(`Successfully recorded debt of ${formatCurrency(Math.abs(amountNum), selectedUser.currency || 'GHS')}`);
      }
      
      // Close dialog and reset form
      setCreditDebtDialogOpen(false);
      setAmount('');
      setNote('');
      
      // Reload data
      await loadUsers();
      
      // Reload transactions if user is still selected
      const updatedUser = users.find(u => u.id === selectedUser.id);
      if (updatedUser) {
        setSelectedUser(updatedUser);
        await loadUserTransactions(updatedUser.id);
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error('Credit/Debt error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to process transaction. Please try again.';
      setError(errorMessage);
      // Keep dialog open on error so user can retry
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      setError('Please fill in all required fields');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await usersApi.create({
        email: newUser.email,
        password: newUser.password,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone || undefined,
        accountType: newUser.accountType,
        status: newUser.status,
      });
      setSuccess('User created successfully');
      setCreateUserDialogOpen(false);
      setNewUser({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        accountType: 'Customer',
        status: 'Active',
      });
      await loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create user');
    } finally {
      setProcessing(false);
    }
  };

  // Filter users based on search query + balance tab
  const balanceCounts = useMemo(() => {
    const counts = { all: users.length, positive: 0, zero: 0, debt: 0 };
    for (const user of users) {
      const balance = Number(user.balance ?? 0);
      if (balance < 0) counts.debt += 1;
      else if (balance === 0) counts.zero += 1;
      else counts.positive += 1;
    }
    return counts;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      const balance = Number(user.balance ?? 0);
      if (balanceTab === 'debt' && !(balance < 0)) return false;
      if (balanceTab === 'zero' && balance !== 0) return false;
      if (balanceTab === 'positive' && !(balance > 0)) return false;
      if (!query) return true;
      return (
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(query)
      );
    });
  }, [users, searchQuery, balanceTab]);

  const handleUserRowKeyDown =
    (user: User) => (event: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setSelectedUser(user);
        loadUserTransactions(user.id);
      }
    };

  if (loading && users.length === 0) {
    return <DashboardStaffChromeSkeleton preset="walletManagement" />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Wallet Management"
        subtitle="Manage customer wallet balances, credits, debts, and transactions."
        updatedAt={null}
        refreshing={refreshing}
        onRefresh={() => void loadUsers(true)}
        showToolbarRefreshOnMobile
        titleVariant="large"
        titleSx={staffLargeTitleSx}
        subtitleSx={staffLargeSubtitleSx}
        actions={
          <Button
            variant="contained"
            disableElevation
            startIcon={<PersonAddIcon />}
            onClick={() => setCreateUserDialogOpen(true)}
            sx={(th) => ({
              ...sxObject(th, compactContainedCtaSx),
              minWidth: { sm: 140 },
              width: { xs: '100%', sm: 'auto' },
            })}
          >
            Create user
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <StaffFilterBar aria-label="Wallet user filters">
        <TextField
          fullWidth
          placeholder="Search by name or email…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={(th) => ({
            ...sxObject(th, staffFilterFieldSx),
            width: { xs: '100%', sm: 280 },
            maxWidth: '100%',
          })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear wallet search"
                  sx={(th) => ({ ...sxObject(th, premiumIconButtonTouchSx) })}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
        />
        <StaffStatusTabs
          aria-label="Balance filter"
          value={balanceTab}
          onChange={setBalanceTab}
          options={[
            { value: 'all', label: 'All', count: balanceCounts.all },
            { value: 'positive', label: 'Credit', count: balanceCounts.positive },
            { value: 'zero', label: 'Zero', count: balanceCounts.zero },
            { value: 'debt', label: 'Debt', count: balanceCounts.debt },
          ]}
        />
      </StaffFilterBar>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ ...premiumTableSurfaceSx, position: 'relative' }}>
            <TableSurfaceProgress active={loading && users.length > 0} ariaLabel="Loading users" />
            <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.75, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Users ({filteredUsers.length})
              </Typography>
            </Box>

            {filteredUsers.length === 0 ? (
              <AppEmptyState
                sx={{ border: 0, boxShadow: 'none', borderRadius: 0 }}
                icon={<PeopleIcon />}
                title={searchQuery || balanceTab !== 'all' ? 'No users match your filters' : 'No users found'}
                description={
                  searchQuery || balanceTab !== 'all'
                    ? 'Try another balance filter or clear the search.'
                    : 'Create a user to start managing wallet balances.'
                }
              />
            ) : useGroupedList ? (
              <Box sx={{ pb: 1 }}>
                <GroupedListSection>
                  {filteredUsers.map((user, index) => {
                    const balance = user.balance ?? 0;
                    const hasDebt = balance < 0;
                    return (
                      <GroupedListRow
                        key={user.id}
                        divider={index < filteredUsers.length - 1}
                        primary={`${user.firstName} ${user.lastName}`.trim()}
                        secondary={user.email}
                        end={
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700, color: hasDebt ? 'error.main' : 'success.main' }}
                            >
                              {formatCurrency(balance, user.currency)}
                            </Typography>
                            {hasDebt ? <AppBadge label="Debt" tone="error" size="small" sx={{ mt: 0.5 }} /> : null}
                          </Box>
                        }
                        onClick={() => {
                          setSelectedUser(user);
                          void loadUserTransactions(user.id);
                        }}
                        aria-label={`Select wallet for ${user.firstName} ${user.lastName}`}
                      />
                    );
                  })}
                </GroupedListSection>
              </Box>
            ) : (
              <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Balance</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const balance = user.balance ?? 0;
                      const hasDebt = balance < 0;

                      return (
                        <TableRow
                          key={user.id}
                          hover
                          selected={selectedUser?.id === user.id}
                          onClick={() => {
                            setSelectedUser(user);
                            void loadUserTransactions(user.id);
                          }}
                          sx={{ cursor: 'pointer' }}
                          onKeyDown={handleUserRowKeyDown(user)}
                          role="button"
                          tabIndex={0}
                          aria-label={`Select wallet for ${user.firstName} ${user.lastName}`}
                        >
                          <TableCell>
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color={hasDebt ? 'error.main' : 'success.main'}
                              fontWeight="bold"
                            >
                              {formatCurrency(balance, user.currency)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              disableElevation
                              startIcon={<AddIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(user);
                                setAmount('');
                                setNote('');
                                setCreditDebtDialogOpen(true);
                              }}
                              sx={(th) => ({ ...sxObject(th, compactContainedCtaSx), py: 0.5, minHeight: 36, fontSize: '0.8125rem' })}
                            >
                              Credit / debt
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={premiumTableSurfaceSx}>
            <Box
              sx={{
                px: { xs: 2, sm: 2.5 },
                py: { xs: 1.75, sm: 2 },
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, minWidth: 0 }}>
                Wallet transactions
                {selectedUser && ` — ${selectedUser.firstName} ${selectedUser.lastName}`}
              </Typography>
              {selectedUser && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setAmount('');
                    setNote('');
                    setCreditDebtDialogOpen(true);
                  }}
                  sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), py: 0.5, minHeight: 36, fontSize: '0.8125rem' })}
                >
                  Credit / debt
                </Button>
              )}
            </Box>

            {selectedUser && userFunds && (
              <Box
                sx={{
                  px: { xs: 2, sm: 2.5 },
                  py: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Available
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {formatCurrency(userFunds.available, userFunds.currency)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    On hold
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: userFunds.reserved > 0 ? 'warning.main' : 'text.primary' }}>
                    {formatCurrency(userFunds.reserved, userFunds.currency)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Wallet total
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {formatCurrency(userFunds.total, userFunds.currency)}
                  </Typography>
                </Box>
              </Box>
            )}

            {selectedUser ? (
              walletTransactions.length === 0 ? (
                <AppEmptyState
                  sx={{ border: 0, boxShadow: 'none', borderRadius: 0 }}
                  icon={<AccountBalanceWalletIcon />}
                  title="No transactions found"
                  description="Wallet ledger entries for this user will appear here."
                />
              ) : useGroupedList ? (
                <Box sx={{ py: 1 }}>
                  <GroupedListSection>
                    {walletTransactions.map((tx, index) => (
                      <GroupedListRow
                        key={tx.id}
                        divider={index < walletTransactions.length - 1}
                        showChevron={false}
                        primary={formatWalletLedgerTypeLabel(tx.type)}
                        secondary={new Date(tx.createdAt).toLocaleDateString()}
                        end={
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: walletLedgerAmountColor(tx.type) }}
                            >
                              {formatWalletLedgerAmount(tx)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatCurrency(tx.balanceAfter, tx.currency)}
                            </Typography>
                          </Box>
                        }
                      />
                    ))}
                  </GroupedListSection>
                  <MobileListLoadMore
                    page={txPage}
                    totalCount={txTotal}
                    pageSize={WALLET_TX_PAGE_SIZE}
                    loading={loadingMoreTx}
                    onLoadMore={() => void handleLoadMoreTransactions()}
                  />
                </Box>
              ) : (
                <>
                  <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Balance</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {walletTransactions.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell>
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <AppBadge
                                label={formatWalletLedgerTypeLabel(tx.type)}
                                tone={chipColorToBadgeTone(getWalletTransactionTypeColor(tx.type))}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: walletLedgerAmountColor(tx.type) }}>
                                {formatWalletLedgerAmount(tx)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {formatCurrency(tx.balanceAfter, tx.currency)}
                            </TableCell>
                          </TableRow>
                        ))}
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
                </>
              )
            ) : (
              <AppEmptyState
                sx={{ border: 0, boxShadow: 'none', borderRadius: 0 }}
                icon={<AccountBalanceWalletIcon />}
                title="Select a user"
                description="Choose a customer on the left to view wallet transactions."
              />
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Credit/Debt Dialog - Unified Form */}
      <Dialog
        open={creditDebtDialogOpen}
        onClose={() => setCreditDebtDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Credit / debt wallet</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                User: <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> ({selectedUser.email})
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Current Balance:
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color={(selectedUser.balance ?? 0) < 0 ? 'error.main' : 'success.main'}
                >
                  {formatCurrency(selectedUser.balance ?? 0, selectedUser.currency)}
                </Typography>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2" component="div">
                  <strong>Credit:</strong> Enter a positive amount (e.g., 100.00) to add funds
                  <br />
                  <strong>Debt:</strong> Enter a negative amount (e.g., -50.00) to record debt or subtract funds
                </Typography>
              </Alert>
            </Box>
          )}
          <TextField
            label="Amount"
            type="number"
            fullWidth
            margin="normal"
            sx={(th) => sxObject(th, authFormFieldSx)}
            value={amount}
            onChange={(e) => {
              const value = e.target.value;
              setAmount(value);
              // Clear error when user starts typing
              if (error && error.includes('amount')) {
                setError(null);
              }
            }}
            inputProps={{ step: 0.01 }}
            required
            disabled={processing}
            error={!!error && error.includes('amount')}
            helperText={
              amount && !isNaN(parseFloat(amount))
                ? parseFloat(amount) > 0
                  ? `Will credit ${formatCurrency(Math.abs(parseFloat(amount)), selectedUser?.currency || 'GHS')}`
                  : parseFloat(amount) < 0
                  ? `Will record debt of ${formatCurrency(Math.abs(parseFloat(amount)), selectedUser?.currency || 'GHS')}`
                  : 'Enter positive amount for credit, negative for debt'
                : 'Enter positive amount for credit, negative for debt'
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography variant="body2" color="text.secondary">
                    {selectedUser?.currency || 'GHS'}
                  </Typography>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Note (optional)"
            fullWidth
            margin="normal"
            sx={(th) => sxObject(th, authFormFieldSx)}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            rows={3}
            disabled={processing}
            placeholder="e.g., Payment received, Outstanding balance, Refund, etc."
          />
          {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) !== 0 && selectedUser && (
            <Alert
              severity={parseFloat(amount) > 0 ? 'success' : 'warning'}
              sx={{ mt: 1 }}
            >
              <Typography variant="body2">
                <strong>New Balance:</strong>{' '}
                {formatCurrency(
                  (parseFloat(selectedUser.balance?.toString() || '0')) + parseFloat(amount),
                  selectedUser.currency || 'GHS'
                )}
              </Typography>
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button
            onClick={() => {
              setCreditDebtDialogOpen(false);
              setAmount('');
              setNote('');
              setError(null);
            }}
            disabled={processing}
            sx={(th) => sxObject(th, compactOutlinedCtaSx)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreditDebt}
            variant="contained"
            disableElevation
            disabled={
              processing ||
              !amount ||
              amount.trim() === '' ||
              isNaN(parseFloat(amount)) ||
              parseFloat(amount) === 0
            }
            startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
            type="button"
            sx={(th) => {
              const n = amount && !isNaN(parseFloat(amount)) ? parseFloat(amount) : 0;
              if (n < 0) return { ...sxObject(th, compactErrorContainedCtaSx) };
              return { ...sxObject(th, compactContainedCtaSx) };
            }}
          >
            {processing
              ? 'Processing…'
              : amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0
              ? 'Credit wallet'
              : amount && !isNaN(parseFloat(amount)) && parseFloat(amount) < 0
              ? 'Record debt'
              : 'Process'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog
        open={createUserDialogOpen}
        onClose={() => setCreateUserDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: (th) => sxObject(th, premiumDialogPaperSx) }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem' }}>Create new user</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              disabled={processing}
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              disabled={processing}
              helperText="Minimum 6 characters"
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="First name"
                fullWidth
                required
                value={newUser.firstName}
                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                disabled={processing}
                sx={(th) => sxObject(th, authFormFieldSx)}
              />
              <TextField
                label="Last name"
                fullWidth
                required
                value={newUser.lastName}
                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                disabled={processing}
                sx={(th) => sxObject(th, authFormFieldSx)}
              />
            </Box>
            <TextField
              label="Phone (optional)"
              fullWidth
              value={newUser.phone}
              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              disabled={processing}
              sx={(th) => sxObject(th, authFormFieldSx)}
            />
            <FormControl fullWidth sx={(th) => sxObject(th, authFormFieldSx)}>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={newUser.accountType}
                label="Account Type"
                onChange={(e) => setNewUser({ ...newUser, accountType: e.target.value })}
                disabled={processing}
              >
                <MenuItem value="Customer">Customer</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="SuperAdmin">Super Admin</MenuItem>
                <MenuItem value="WalkIn">Walk-In</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={(th) => sxObject(th, authFormFieldSx)}>
              <InputLabel>Status</InputLabel>
              <Select
                value={newUser.status}
                label="Status"
                onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                disabled={processing}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, flexWrap: 'wrap', gap: 1 }}>
          <Button
            onClick={() => setCreateUserDialogOpen(false)}
            disabled={processing}
            sx={(th) => sxObject(th, compactOutlinedCtaSx)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateUser}
            variant="contained"
            disableElevation
            disabled={
              processing ||
              !newUser.email ||
              !newUser.password ||
              !newUser.firstName ||
              !newUser.lastName ||
              newUser.password.length < 6
            }
            startIcon={processing ? <CircularProgress size={20} /> : <PersonAddIcon />}
            sx={(th) => sxObject(th, compactContainedCtaSx)}
          >
            {processing ? 'Creating…' : 'Create user'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}



