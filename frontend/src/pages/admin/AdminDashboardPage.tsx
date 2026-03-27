import { Box, Typography, Grid, Card, CardContent, Alert, CircularProgress, Button } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EvStationIcon from '@mui/icons-material/EvStation';
import HistoryIcon from '@mui/icons-material/History';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, DashboardStats } from '../../services/dashboardApi';
import { websocketService } from '../../services/websocket';
import { DashboardNavIcon, premiumNavCardSx } from '../../components/dashboard/DashboardNavIcon';
import {
  jampackKpiCardBaseSx,
  jampackKpiCardHoverSx,
  dashboardPageTitleSx,
  dashboardPageSubtitleSx,
} from '../../theme/jampackShell';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUserRole(userData.accountType || 'Customer');
        
        // Redirect if not Admin or SuperAdmin
        if (userData.accountType !== 'Admin' && userData.accountType !== 'SuperAdmin') {
            if (userData.accountType === 'Customer') {
              window.location.href = '/user/dashboard';
            } else {
            window.location.href = '/login';
          }
        }
      } catch (e) {
        window.location.href = '/login';
      }
    } else {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    loadStats();
    
    // Set up WebSocket listeners for real-time updates
    const unsubscribeTransactionStarted = websocketService.on('transactionStarted', () => {
      // Reload stats when transaction starts
      loadStats();
    });

    const unsubscribeTransactionStopped = websocketService.on('transactionStopped', (event) => {
      // Reload stats when transaction stops (updates revenue, active sessions)
      console.log('Transaction stopped event received:', event);
      loadStats();
    });

    const unsubscribeChargePointStatus = websocketService.on('chargePointStatus', () => {
      // Reload stats when charge point status changes
      loadStats();
    });

    const unsubscribeDashboardStats = websocketService.on('dashboardStatsUpdate', (event) => {
      // Update stats in real-time if for this vendor
      console.log('Dashboard stats update received:', event);
      const vendorId = localStorage.getItem('currentVendorId');
      if (!vendorId || event.data.vendorId?.toString() === vendorId) {
        loadStats();
      }
    });

    // Cleanup
    return () => {
      unsubscribeTransactionStarted();
      unsubscribeTransactionStopped();
      unsubscribeChargePointStatus();
      unsubscribeDashboardStats();
    };
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error loading dashboard stats:', err);
      setError(err.message || 'Failed to load dashboard statistics');
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
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0, flex: '1 1 200px' }}>
          <Typography component="h1" variant="h6" sx={dashboardPageTitleSx}>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            Manage your vendor's charging operations and settings.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={loadStats}
          disabled={loading}
          startIcon={loading ? <CircularProgress sx={{ width: 16, height: 16 }} /> : <RefreshIcon />}
          sx={{ width: { xs: '100%', sm: 'auto' }, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={[jampackKpiCardBaseSx, jampackKpiCardHoverSx, { cursor: 'pointer' }]}
              onClick={() => navigate('/admin/ops/devices')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats.overview.totalChargePoints || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Charge Points
                    </Typography>
                  </Box>
                  <EvStationIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              elevation={0}
              sx={[
                jampackKpiCardBaseSx,
                jampackKpiCardHoverSx,
                {
                  cursor: 'pointer',
                  '@media (hover: hover) and (pointer: fine)': {
                    '&:hover': { borderColor: 'info.main' },
                  },
                },
              ]}
              onClick={() => navigate('/admin/ops/sessions')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats.overview.activeSessions || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Sessions
                    </Typography>
                  </Box>
                  <BatteryChargingFullIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={[jampackKpiCardBaseSx, jampackKpiCardHoverSx]}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats.overview.totalUsers || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Users
                    </Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={[jampackKpiCardBaseSx, jampackKpiCardHoverSx]}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        mb: 0.5,
                        lineHeight: 1.25,
                        wordBreak: 'break-word',
                        fontSize: { xs: '1.2rem', sm: '1.625rem', md: '2.125rem' },
                      }}
                    >
                      {stats.overview.totalRevenue ? `GHS ${stats.overview.totalRevenue.toLocaleString()}` : 'GHS 0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue
                    </Typography>
                  </Box>
                  <AttachMoneyIcon sx={{ fontSize: 40, color: 'secondary.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={{ xs: 2, sm: 2.5 }}>
        <Grid item xs={12} sm={6} lg={4}>
          <Card elevation={0} sx={premiumNavCardSx('primary')} onClick={() => navigate('/admin/ops')}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: { xs: 1, sm: 0 } }}>
                <DashboardNavIcon accent="primary">
                  <DashboardIcon sx={{ color: 'primary.main', fontSize: 26 }} />
                </DashboardNavIcon>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Operations
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Monitor charging operations
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Card elevation={0} sx={premiumNavCardSx('info')} onClick={() => navigate('/admin/ops/sessions')}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: { xs: 1, sm: 0 } }}>
                <DashboardNavIcon accent="info">
                  <HistoryIcon sx={{ color: 'info.main', fontSize: 26 }} />
                </DashboardNavIcon>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Sessions
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    View charging sessions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Card elevation={0} sx={premiumNavCardSx('success')} onClick={() => navigate('/admin/ops/devices')}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: { xs: 1, sm: 0 } }}>
                <DashboardNavIcon accent="success">
                  <EvStationIcon sx={{ color: 'success.main', fontSize: 26 }} />
                </DashboardNavIcon>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Devices
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Manage charge points
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Card elevation={0} sx={premiumNavCardSx('secondary')} onClick={() => navigate('/vendor')}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: { xs: 1, sm: 0 } }}>
                <DashboardNavIcon accent="secondary">
                  <BusinessIcon sx={{ color: 'secondary.main', fontSize: 26 }} />
                </DashboardNavIcon>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Vendor Settings
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Configure vendor details
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Card elevation={0} sx={premiumNavCardSx('info')} onClick={() => navigate('/admin/wallets')}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: { xs: 1, sm: 0 } }}>
                <DashboardNavIcon accent="info">
                  <AccountBalanceWalletIcon sx={{ color: 'info.main', fontSize: 26 }} />
                </DashboardNavIcon>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Wallets
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Manage user wallets
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

