import { Box, Typography, Grid, Paper, Alert, CircularProgress, Button, LinearProgress, Link } from '@mui/material';
import EvStationIcon from '@mui/icons-material/EvStation';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardRealtime } from '../../hooks/useDashboardRealtime';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import {
  jampackKpiCardBaseSx,
  jampackKpiCardHoverSx,
  dashboardPageTitleSx,
  dashboardPageSubtitleSx,
} from '../../theme/jampackShell';
import { compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { formatCurrency } from '../../utils/formatters';
import { OpsQuickActions } from '../../components/dashboard/OpsQuickActions';
import { LiveDataMeta } from '../../components/dashboard/LiveDataMeta';
import { SUPERADMIN_ROUTES } from '../../config/staffNav.paths';

export function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const { stats, loading, refreshing, error, updatedAt, loadStats, setError } = useDashboardStats();

  useDashboardRealtime(useCallback(() => void loadStats(true), [loadStats]), 'superadmin');

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
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      {refreshing && (
        <LinearProgress
          sx={{ mb: 2, borderRadius: 1 }}
          aria-label="Updating dashboard statistics"
        />
      )}
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
            Super Admin Dashboard
          </Typography>
          <Typography variant="body2" sx={dashboardPageSubtitleSx}>
            Complete system control and management across all vendors and users.
          </Typography>
          <LiveDataMeta updatedAt={updatedAt} showSeconds />
        </Box>
        <Button
          variant="outlined"
          onClick={() => void loadStats(false)}
          disabled={loading || refreshing}
          startIcon={
            loading || refreshing ? <CircularProgress size={16} /> : <RefreshIcon />
          }
          sx={(th) => ({
            ...sxObject(th, compactOutlinedCtaSx),
            width: { xs: '100%', sm: 'auto' },
            alignSelf: { xs: 'stretch', sm: 'flex-start' },
          })}
        >
          Refresh
        </Button>
      </Box>

      <OpsQuickActions />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {stats && (
        <>
          <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 1 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={[jampackKpiCardBaseSx, jampackKpiCardHoverSx, { cursor: 'pointer' }]}
                onClick={() => navigate(SUPERADMIN_ROUTES.vendors)}
                role="button"
                tabIndex={0}
                aria-label="Open vendors"
                onKeyDown={createKeyboardNavHandler(SUPERADMIN_ROUTES.vendors)}
              >
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {stats.overview.totalVendors || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Vendors
                      </Typography>
                    </Box>
                    <BusinessIcon sx={{ fontSize: 40, color: 'secondary.main', opacity: 0.7 }} />
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={[jampackKpiCardBaseSx, jampackKpiCardHoverSx, { cursor: 'pointer' }]}
                onClick={() => navigate(SUPERADMIN_ROUTES.opsDevices)}
                role="button"
                tabIndex={0}
                aria-label="Open devices"
                onKeyDown={createKeyboardNavHandler(SUPERADMIN_ROUTES.opsDevices)}
              >
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {stats.overview.totalChargePoints || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Charge points
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
                onClick={() => navigate(SUPERADMIN_ROUTES.opsSessions)}
                role="button"
                tabIndex={0}
                aria-label="Open sessions"
                onKeyDown={createKeyboardNavHandler(SUPERADMIN_ROUTES.opsSessions)}
              >
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {stats.overview.activeSessions || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active sessions
                      </Typography>
                    </Box>
                    <BatteryChargingFullIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
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
                onClick={() => navigate(SUPERADMIN_ROUTES.reports)}
                role="button"
                tabIndex={0}
                aria-label="Open revenue reports"
                onKeyDown={createKeyboardNavHandler(SUPERADMIN_ROUTES.reports)}
              >
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
                        Total revenue
                      </Typography>
                    </Box>
                    <AttachMoneyIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {stats.connectionHealth && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 0 }}>
              Network health: {stats.connectionHealth.averageSuccessRate.toFixed(1)}% success ·{' '}
              {stats.connectionHealth.devicesWithErrors} devices need attention —{' '}
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate(SUPERADMIN_ROUTES.health)}
                sx={{ verticalAlign: 'baseline', p: 0, minWidth: 0 }}
              >
                System health
              </Link>
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}
