import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
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
  Tabs,
  Tab,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HistoryIcon from '@mui/icons-material/History';
import PaymentIcon from '@mui/icons-material/Payment';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import { transactionsApi } from '../../services/transactionsApi';
import { walletApi } from '../../services/walletApi';
import { paymentsApi } from '../../services/paymentsApi';
import { websocketService } from '../../services/websocket';
import { DashboardNavIcon, premiumStatCardSx } from '../../components/dashboard/DashboardNavIcon';
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumPanelCardSx } from '../../theme/jampackShell';
import { compactContainedCtaSx, sxObject } from '../../styles/authShell';
import { getStoredUser } from '../../utils/authSession';
import { formatCurrency, formatDurationMinutes, formatEnergyKwh } from '../../utils/formatters';
import { getPaymentStatusColor, getTransactionStatusColor } from '../../utils/statusColors';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: { xs: 2, sm: 3 }, px: { xs: 0.5, sm: 0 } }}>{children}</Box>}
    </div>
  );
}

export function CustomerDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // Load user once on mount
  useEffect(() => {
    setUser(getStoredUser());
  }, []); // Only run once on mount

  // Load dashboard data and set up WebSocket listeners
  useEffect(() => {
    if (!user) return; // Wait for user to be loaded
    
    loadDashboardData();
    
    // Set up WebSocket listeners for real-time updates
    const unsubscribeTransactionStarted = websocketService.on('transactionStarted', (event) => {
      // Reload transactions when a new one starts
      if (event.data.userId === user?.id) {
        loadDashboardData();
      }
    });

    const unsubscribeTransactionStopped = websocketService.on('transactionStopped', (event) => {
      // Reload dashboard when transaction completes (updates wallet balance, transactions)
      console.log('Transaction stopped event received:', event);
      if (event.data.userId === user?.id || !event.data.userId) {
        loadDashboardData();
      }
    });

    const unsubscribeMeterValue = websocketService.on('meterValue', (event) => {
      // Update active transactions in real-time
      if (event.data.transactionId) {
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.transactionId === event.data.transactionId
              ? { ...tx, totalEnergyKwh: event.data.value / 1000 } // Convert Wh to kWh
              : tx
          )
        );
      }
    });

    const unsubscribeWalletBalance = websocketService.on('walletBalanceUpdate', (event) => {
      // Update wallet balance in real-time
      if (event.data.userId === user?.id) {
        setWalletBalance(event.data.balance);
      }
    });

    // Cleanup
    return () => {
      unsubscribeTransactionStarted();
      unsubscribeTransactionStopped();
      unsubscribeMeterValue();
      unsubscribeWalletBalance();
    };
  }, [user?.id]); // Only depend on user.id, not the whole user object

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // User is already loaded in separate useEffect, no need to reload here

      // Load wallet balance
      try {
        const balance = await walletApi.getBalance();
        if (typeof balance === 'number') {
          setWalletBalance(balance);
        } else if (balance && typeof balance.balance === 'number') {
          setWalletBalance(balance.balance);
        } else {
          setWalletBalance(0);
        }
      } catch (err) {
        console.error('Error loading wallet balance:', err);
        setWalletBalance(0);
      }

      // Load recent transactions
      try {
        if (typeof user?.id !== 'number') {
          setTransactions([]);
        } else {
          const txsResponse = await transactionsApi.getAll(10, 0, undefined, undefined, user.id);
          if (txsResponse && txsResponse.transactions) {
            setTransactions(txsResponse.transactions);
          } else if (Array.isArray(txsResponse)) {
            setTransactions(txsResponse);
          } else {
            setTransactions([]);
          }
        }
      } catch (err) {
        console.error('Error loading transactions:', err);
        setTransactions([]);
      }

      // Load recent payments
      try {
        const pays = await paymentsApi.getUserPayments();
        if (Array.isArray(pays)) {
          setPayments(pays);
        } else if (pays && Array.isArray(pays.payments)) {
          setPayments(pays.payments);
        } else {
          setPayments([]);
        }
      } catch (err) {
        console.error('Error loading payments:', err);
        setPayments([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionRowKeyDown =
    (transactionId: string | number) => (event: React.KeyboardEvent<HTMLTableRowElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        navigate(`/user/sessions/${transactionId}`);
      }
    };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ minWidth: 0, flex: '1 1 200px' }}>
          <Typography component="h1" variant="h6" sx={dashboardPageTitleSx}>
            My Dashboard
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            Welcome back! Here's an overview of your account.
          </Typography>
        </Box>
        <Button
          variant="contained"
          disableElevation
          startIcon={<LocationOnIcon />}
          onClick={() => navigate('/stations')}
          sx={(th) => ({
            ...sxObject(th, compactContainedCtaSx),
            width: { xs: '100%', sm: 'auto' },
            alignSelf: { xs: 'stretch', sm: 'flex-start' },
          })}
        >
          Find Stations
        </Button>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Paper elevation={0} sx={{ bgcolor: 'background.paper', ...premiumStatCardSx('primary') }}>
            <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <DashboardNavIcon accent="primary" compact noRightMargin>
                  <AccountBalanceWalletIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                </DashboardNavIcon>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Wallet
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1.5, fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                {formatCurrency(walletBalance, 'GHS')}
              </Typography>
              <Button
                size="small"
                variant="contained"
                disableElevation
                fullWidth
                onClick={() => navigate('/user/wallet/top-up')}
                sx={(th) => sxObject(th, compactContainedCtaSx)}
              >
                Top Up Wallet
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Paper elevation={0} sx={{ bgcolor: 'background.paper', ...premiumStatCardSx('success') }}>
            <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <DashboardNavIcon accent="success" compact noRightMargin>
                  <BatteryChargingFullIcon sx={{ color: 'success.main', fontSize: 24 }} />
                </DashboardNavIcon>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Sessions
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5, fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                {transactions.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total charging sessions
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Paper elevation={0} sx={{ bgcolor: 'background.paper', ...premiumStatCardSx('info') }}>
            <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <DashboardNavIcon accent="info" compact noRightMargin>
                  <PaymentIcon sx={{ color: 'info.main', fontSize: 24 }} />
                </DashboardNavIcon>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Payments
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5, fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                {payments.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total payments made
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Paper elevation={0} sx={{ bgcolor: 'background.paper', ...premiumStatCardSx('secondary') }}>
            <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <DashboardNavIcon accent="secondary" compact noRightMargin>
                  <HistoryIcon sx={{ color: 'secondary.main', fontSize: 24 }} />
                </DashboardNavIcon>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Active
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5, fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                {transactions.filter((t) => t.status === 'Active').length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active charging sessions
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9375rem',
              minHeight: 56,
              '&.Mui-selected': {
                color: 'primary.main',
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab label="Recent Transactions" />
          <Tab label="Payment History" />
          <Tab label="Profile" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No transactions yet
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                        <TableRow
                          key={tx.id}
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/user/sessions/${tx.transactionId}`)}
                          onKeyDown={handleTransactionRowKeyDown(tx.transactionId)}
                          role="button"
                          tabIndex={0}
                          aria-label={`Open transaction ${tx.transactionId}`}
                        >
                      <TableCell>{tx.transactionId}</TableCell>
                      <TableCell>{tx.chargePointId}</TableCell>
                      <TableCell>
                        {formatEnergyKwh(tx.totalEnergyKwh)}
                      </TableCell>
                      <TableCell>
                        {formatDurationMinutes(tx.durationMinutes)}
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
                      <TableCell>
                        {new Date(tx.startTime).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <TableContainer sx={{ maxHeight: 600, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Payment ID</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No payments yet
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.id}</TableCell>
                      <TableCell>
                        {formatCurrency(payment.amount, payment.currency || 'GHS')}
                      </TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>
                        <Chip
                          label={payment.status}
                          color={getPaymentStatusColor(payment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

            <TabPanel value={activeTab} index={2}>
              {user && (
                <Box>
                  {/* Profile Header with Avatar */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, sm: 3 },
                      mb: 3,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'center', sm: 'center' },
                        gap: { xs: 2, sm: 3 },
                        textAlign: { xs: 'center', sm: 'left' },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: { xs: 72, sm: 88 },
                          height: { xs: 72, sm: 88 },
                          bgcolor: 'primary.main',
                          fontSize: { xs: '1.75rem', sm: '2rem' },
                          fontWeight: 700,
                        }}
                      >
                        {user.firstName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        {user.lastName?.[0]?.toUpperCase() || ''}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Chip label={user.accountType} color="primary" variant="outlined" size="small" sx={{ fontWeight: 600 }} />
                      </Box>
                    </Box>
                  </Paper>

                  {/* Profile Details Cards */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper
                        elevation={0}
                        sx={{
                          ...premiumPanelCardSx,
                          p: { xs: 2, sm: 3 },
                          height: '100%',
                          borderLeft: '4px solid',
                          borderLeftColor: 'primary.main',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '@media (hover: hover) and (pointer: fine)': {
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 4,
                            },
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: 'primary.main',
                              width: 48,
                              height: 48,
                              mr: 2,
                              flexShrink: 0,
                            }}
                          >
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                              Full Name
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, mt: 0.5 }}>
                              {user.firstName} {user.lastName}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Paper
                        elevation={0}
                        sx={{
                          ...premiumPanelCardSx,
                          p: { xs: 2, sm: 3 },
                          height: '100%',
                          borderLeft: '4px solid',
                          borderLeftColor: 'info.main',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '@media (hover: hover) and (pointer: fine)': {
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 4,
                            },
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: 'info.main',
                              width: 48,
                              height: 48,
                              mr: 2,
                              flexShrink: 0,
                            }}
                          >
                            <EmailIcon />
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                              Email Address
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, mt: 0.5, wordBreak: 'break-word' }}>
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Paper
                        elevation={0}
                        sx={{
                          ...premiumPanelCardSx,
                          p: { xs: 2, sm: 3 },
                          height: '100%',
                          borderLeft: '4px solid',
                          borderLeftColor: 'success.main',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '@media (hover: hover) and (pointer: fine)': {
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 4,
                            },
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: 'success.main',
                              width: 48,
                              height: 48,
                              mr: 2,
                              flexShrink: 0,
                            }}
                          >
                            <BadgeIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                              Account Type
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, mt: 0.5 }}>
                              {user.accountType}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Paper
                        elevation={0}
                        sx={{
                          ...premiumPanelCardSx,
                          p: { xs: 2, sm: 3 },
                          height: '100%',
                          borderLeft: '4px solid',
                          borderLeftColor: 'secondary.main',
                          bgcolor: 'action.hover',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '@media (hover: hover) and (pointer: fine)': {
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 4,
                            },
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: 'secondary.main',
                              width: 48,
                              height: 48,
                              mr: 2,
                              flexShrink: 0,
                            }}
                          >
                            <AccountBalanceWalletIcon />
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                              Wallet Balance
                            </Typography>
                            <Typography
                              variant="h5"
                              sx={{
                                fontWeight: 700,
                                mt: 0.5,
                                color: 'secondary.dark',
                              }}
                            >
                              {formatCurrency(walletBalance, 'GHS')}
                            </Typography>
                            <Button
                              size="small"
                              variant="contained"
                              color="secondary"
                              disableElevation
                              startIcon={<EditIcon />}
                              sx={(th) => ({
                                ...sxObject(th, compactContainedCtaSx),
                                mt: 2,
                                width: { xs: '100%', sm: 'auto' },
                                bgcolor: 'secondary.main',
                                color: 'secondary.contrastText',
                                '&:hover': { bgcolor: 'secondary.dark' },
                              })}
                              onClick={() => navigate('/user/wallet/top-up')}
                            >
                              Top Up Wallet
                            </Button>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>

                  {/* Additional Info Section */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, sm: 3 },
                      mt: 3,
                      bgcolor: 'background.default',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccountCircleIcon color="primary" />
                      Account Information
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Member Since
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          User ID
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                          #{user.id || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>
              )}
            </TabPanel>
      </Paper>
    </Box>
  );
}

