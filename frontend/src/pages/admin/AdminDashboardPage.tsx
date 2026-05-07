import { Box, Typography, Grid, Paper, Alert, CircularProgress } from '@mui/material';
import EvStationIcon from '@mui/icons-material/EvStation';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
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
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { ADMIN_ROUTES } from '../../config/staffNav.paths';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const { stats, loading, refreshing, error, updatedAt, loadStats, setError } = useDashboardStats();

  useDashboardRealtime(useCallback(() => void loadStats(true), [loadStats]), 'admin');

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
      <LivePageHeader
        title="Admin Dashboard"
        subtitle="Manage your vendor's charging operations and settings"
        updatedAt={updatedAt}
        showSeconds
        refreshing={refreshing}
        refreshDisabled={loading}
        onRefresh={() => void loadStats(false)}
        titleSx={dashboardPageTitleSx}
        subtitleSx={dashboardPageSubtitleSx}
        refreshSx={(th) => ({
          ...sxObject(th, compactOutlinedCtaSx),
          width: { xs: '100%', sm: 'auto' },
          alignSelf: { xs: 'stretch', sm: 'flex-start' },
        })}
      />

      <OpsQuickActions />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {stats && (
        <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 1 }}>
          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              sx={[jampackKpiCardBaseSx, jampackKpiCardHoverSx, { cursor: 'pointer' }]}
              onClick={() => navigate(ADMIN_ROUTES.opsDevices)}
              role="button"
              tabIndex={0}
              aria-label="Open devices"
              onKeyDown={createKeyboardNavHandler(ADMIN_ROUTES.opsDevices)}
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

          <Grid item xs={12} sm={4}>
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
              onClick={() => navigate(ADMIN_ROUTES.opsSessions)}
              role="button"
              tabIndex={0}
              aria-label="Open sessions"
              onKeyDown={createKeyboardNavHandler(ADMIN_ROUTES.opsSessions)}
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

          <Grid item xs={12} sm={4}>
            <Paper
              elevation={0}
              sx={[
                jampackKpiCardBaseSx,
                jampackKpiCardHoverSx,
                {
                  cursor: 'pointer',
                  '@media (hover: hover) and (pointer: fine)': {
                    '&:hover': { borderColor: 'secondary.main' },
                  },
                },
              ]}
              onClick={() => navigate(ADMIN_ROUTES.reports)}
              role="button"
              tabIndex={0}
              aria-label="Open revenue reports"
              onKeyDown={createKeyboardNavHandler(ADMIN_ROUTES.reports)}
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
                  <AttachMoneyIcon sx={{ fontSize: 40, color: 'secondary.main', opacity: 0.7 }} />
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
