import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
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
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import { transactionsApi } from '../../services/transactionsApi';
import { walletApi } from '../../services/walletApi';
import { paymentsApi } from '../../services/paymentsApi';

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
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user from localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
          
          // Verify this is a Customer user - redirect if not
          if (userData.accountType !== 'Customer' && userData.accountType !== 'WalkIn') {
            if (userData.accountType === 'SuperAdmin') {
              window.location.href = '/superadmin/dashboard';
            } else if (userData.accountType === 'Admin') {
              window.location.href = '/admin/dashboard';
            }
            return;
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

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
        const txsResponse = await transactionsApi.getAll(10, 0);
        if (txsResponse && txsResponse.transactions) {
          setTransactions(txsResponse.transactions);
        } else if (Array.isArray(txsResponse)) {
          setTransactions(txsResponse);
        } else {
          setTransactions([]);
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            color: '#1e293b',
            mb: 0.5,
            fontSize: { xs: '1.75rem', sm: '2rem' },
          }}
        >
          My Dashboard
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Welcome back! Here's an overview of your account.
        </Typography>
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
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 25px rgba(102, 126, 234, 0.15)',
                borderColor: 'primary.main',
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AccountBalanceWalletIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                  Wallet
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#1e293b',
                  mb: 1.5,
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                }}
              >
                GHS {walletBalance.toFixed(2)}
              </Typography>
              <Button
                size="small"
                variant="contained"
                fullWidth
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 0.75,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3d8f 100%)',
                  },
                }}
                onClick={() => navigate('/user/wallet')}
              >
                Top Up Wallet
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(135deg, #10b98115 0%, #05966915 100%)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.15)',
                borderColor: 'success.main',
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BatteryChargingFullIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                  Sessions
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#1e293b',
                  mb: 0.5,
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                }}
              >
                {transactions.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Total charging sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(135deg, #3b82f615 0%, #2563eb15 100%)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 25px rgba(59, 130, 246, 0.15)',
                borderColor: 'info.main',
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PaymentIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                  Payments
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#1e293b',
                  mb: 0.5,
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                }}
              >
                {payments.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Total payments made
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(135deg, #f59e0b15 0%, #d9770615 100%)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 25px rgba(245, 158, 11, 0.15)',
                borderColor: 'warning.main',
              },
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <HistoryIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                  Active
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: '#1e293b',
                  mb: 0.5,
                  fontSize: { xs: '1.5rem', sm: '1.75rem' },
                }}
              >
                {transactions.filter((t) => t.status === 'Active').length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Active charging sessions
              </Typography>
            </CardContent>
          </Card>
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
          <TableContainer>
            <Table>
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
                          onClick={() => navigate(`/user/transactions/${tx.transactionId}`)}
                        >
                      <TableCell>{tx.transactionId}</TableCell>
                      <TableCell>{tx.chargePointId}</TableCell>
                      <TableCell>{tx.totalEnergyKwh?.toFixed(2) || '-'}</TableCell>
                      <TableCell>
                        {tx.durationMinutes ? `${Math.floor(tx.durationMinutes / 60)}h ${tx.durationMinutes % 60}m` : '-'}
                      </TableCell>
                      <TableCell>
                        {tx.totalCost ? `GHS ${tx.totalCost.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tx.status}
                          color={
                            tx.status === 'Completed'
                              ? 'success'
                              : tx.status === 'Active'
                              ? 'info'
                              : 'default'
                          }
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
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
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
                        {payment.currency} {payment.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>
                        <Chip
                          label={payment.status}
                          color={payment.status === 'Succeeded' ? 'success' : 'default'}
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
                      p: 4,
                      mb: 3,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: 2,
                      color: 'white',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Avatar
                        sx={{
                          width: 100,
                          height: 100,
                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                          border: '4px solid rgba(255, 255, 255, 0.3)',
                          fontSize: '2.5rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {user.firstName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        {user.lastName?.[0]?.toUpperCase() || ''}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Chip
                          label={user.accountType}
                          sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontWeight: 600,
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                          }}
                        />
                      </Box>
                    </Box>
                  </Paper>

                  {/* Profile Details Cards */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Card
                        elevation={2}
                        sx={{
                          p: 3,
                          height: '100%',
                          borderLeft: '4px solid',
                          borderLeftColor: 'primary.main',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4,
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
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Card
                        elevation={2}
                        sx={{
                          p: 3,
                          height: '100%',
                          borderLeft: '4px solid',
                          borderLeftColor: 'info.main',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4,
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
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Card
                        elevation={2}
                        sx={{
                          p: 3,
                          height: '100%',
                          borderLeft: '4px solid',
                          borderLeftColor: 'success.main',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4,
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
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Card
                        elevation={2}
                        sx={{
                          p: 3,
                          height: '100%',
                          borderLeft: '4px solid',
                          borderLeftColor: 'warning.main',
                          background: 'linear-gradient(135deg, #fff9e6 0%, #ffffff 100%)',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: 'warning.main',
                              width: 48,
                              height: 48,
                              mr: 2,
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
                                color: 'warning.dark',
                              }}
                            >
                              GHS {walletBalance.toFixed(2)}
                            </Typography>
                            <Button
                              size="small"
                              variant="contained"
                              color="warning"
                              startIcon={<EditIcon />}
                              sx={{ mt: 2 }}
                              onClick={() => navigate('/user/wallet')}
                            >
                              Top Up Wallet
                            </Button>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Additional Info Section */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
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

