import { Box, Typography, Grid, Paper, Alert, CircularProgress, Button } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EvStationIcon from '@mui/icons-material/EvStation';
import HistoryIcon from '@mui/icons-material/History';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, DashboardStats } from '../../services/dashboardApi';
import { useDashboardRealtime } from '../../hooks/useDashboardRealtime';
import { DashboardNavIcon, premiumNavCardSx } from '../../components/dashboard/DashboardNavIcon';
import {
  jampackKpiCardBaseSx,
  jampackKpiCardHoverSx,
  dashboardPageTitleSx,
  dashboardPageSubtitleSx,
} from '../../theme/jampackShell';
import { compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { formatCurrency } from '../../utils/formatters';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useDashboardRealtime(loadStats, 'admin');

  const createKeyboardNavHandler =
    (path: string) => (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        navigate(path);
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
          sx={(th) => ({
            ...sxObject(th, compactOutlinedCtaSx),
            width: { xs: '100%', sm: 'auto' },
            alignSelf: { xs: 'stretch', sm: 'flex-start' },
          })}
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
            <Paper
              elevation={0}
              sx={[jampackKpiCardBaseSx, jampackKpiCardHoverSx, { cursor: 'pointer' }]}
              onClick={() => navigate('/admin/ops/devices')}
              role="button"
              tabIndex={0}
              aria-label="Open devices"
              onKeyDown={createKeyboardNavHandler('/admin/ops/devices')}
            >
              <Box sx={{ p: 2 }}>
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
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
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
              role="button"
              tabIndex={0}
              aria-label="Open sessions"
              onKeyDown={createKeyboardNavHandler('/admin/ops/sessions')}
            >
              <Box sx={{ p: 2 }}>
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
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={[jampackKpiCardBaseSx, jampackKpiCardHoverSx]}>
              <Box sx={{ p: 2 }}>
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
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={0} sx={[jampackKpiCardBaseSx, jampackKpiCardHoverSx]}>
              <Box sx={{ p: 2 }}>
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
                      {formatCurrency(stats.overview.totalRevenue ?? 0, 'GHS')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue
                    </Typography>
                  </Box>
                  <AttachMoneyIcon sx={{ fontSize: 40, color: 'secondary.main', opacity: 0.7 }} />
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={{ xs: 2, sm: 2.5 }}>
        <Grid item xs={12} sm={6} lg={4}>
          <Paper
            elevation={0}
            sx={premiumNavCardSx('primary')}
            onClick={() => navigate('/admin/ops')}
            role="button"
            tabIndex={0}
            aria-label="Open operations"
            onKeyDown={createKeyboardNavHandler('/admin/ops')}
          >
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
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
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Paper
            elevation={0}
            sx={premiumNavCardSx('info')}
            onClick={() => navigate('/admin/ops/sessions')}
            role="button"
            tabIndex={0}
            aria-label="Open sessions"
            onKeyDown={createKeyboardNavHandler('/admin/ops/sessions')}
          >
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
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
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Paper
            elevation={0}
            sx={premiumNavCardSx('success')}
            onClick={() => navigate('/admin/ops/devices')}
            role="button"
            tabIndex={0}
            aria-label="Open devices"
            onKeyDown={createKeyboardNavHandler('/admin/ops/devices')}
          >
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
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
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Paper
            elevation={0}
            sx={premiumNavCardSx('secondary')}
            onClick={() => navigate('/vendor')}
            role="button"
            tabIndex={0}
            aria-label="Open vendor settings"
            onKeyDown={createKeyboardNavHandler('/vendor')}
          >
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
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
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          <Paper
            elevation={0}
            sx={premiumNavCardSx('info')}
            onClick={() => navigate('/admin/wallets')}
            role="button"
            tabIndex={0}
            aria-label="Open wallets"
            onKeyDown={createKeyboardNavHandler('/admin/wallets')}
          >
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
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
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

