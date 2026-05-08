import { useCallback } from 'react';
import { Box, Typography, Grid, Alert, Link } from '@mui/material';
import EvStationIcon from '@mui/icons-material/EvStation';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import BusinessIcon from '@mui/icons-material/Business';
import { useNavigate } from 'react-router-dom';
import { useDashboardRealtime } from '../../hooks/useDashboardRealtime';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { dashboardPageTitleSx, dashboardPageSubtitleSx } from '../../theme/jampackShell';
import { compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { formatCurrency } from '../../utils/formatters';
import { LivePageHeader } from './LivePageHeader';
import { ADMIN_ROUTES, SUPERADMIN_ROUTES } from '../../config/staffNav.paths';
import { DashboardMetricCard } from './DashboardMetricCard';
import { DashboardStaffHomeSkeleton } from './DashboardStaffHomeSkeleton';

const currencyValueSx = {
  lineHeight: 1.25,
  wordBreak: 'break-word',
  fontSize: { xs: '1.2rem', sm: '1.625rem', md: '2.125rem' },
} as const;

type StaffDashboardVariant = 'admin' | 'superadmin';

export function StaffDashboardHomeView({ variant }: { variant: StaffDashboardVariant }) {
  const navigate = useNavigate();
  const { stats, loading, refreshing, error, updatedAt, loadStats, setError } = useDashboardStats();

  useDashboardRealtime(
    useCallback(() => void loadStats(true), [loadStats]),
    variant === 'superadmin' ? 'superadmin' : 'admin'
  );

  const createKeyboardNavHandler =
    (path: string) => (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        navigate(path);
      }
    };

  if (loading) {
    return <DashboardStaffHomeSkeleton variant={variant} />;
  }

  const title = variant === 'admin' ? 'Admin Dashboard' : 'Super Admin Dashboard';
  const subtitle =
    variant === 'admin'
      ? "Manage your vendor's charging operations and settings"
      : 'Complete system control and management across all vendors and users';

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title={title}
        subtitle={subtitle}
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

      {error != null ? (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {stats != null ? (
        <>
          <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 1 }}>
            {variant === 'superadmin' ? (
              <Grid item xs={12} sm={6} md={3}>
                <DashboardMetricCard
                  value={stats.overview.totalVendors || 0}
                  label="Vendors"
                  icon={<BusinessIcon sx={{ fontSize: 40, color: 'secondary.main', opacity: 0.7 }} />}
                  ariaLabel="Open vendors"
                  onClick={() => navigate(SUPERADMIN_ROUTES.vendors)}
                  onKeyDown={createKeyboardNavHandler(SUPERADMIN_ROUTES.vendors)}
                  hoverAccent="secondary"
                />
              </Grid>
            ) : null}

            <Grid item xs={12} sm={variant === 'admin' ? 4 : 6} md={variant === 'admin' ? undefined : 3}>
              <DashboardMetricCard
                value={stats.overview.totalChargePoints || 0}
                label="Charge points"
                icon={<EvStationIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />}
                ariaLabel="Open devices"
                onClick={() =>
                  navigate(variant === 'admin' ? ADMIN_ROUTES.opsDevices : SUPERADMIN_ROUTES.opsDevices)
                }
                onKeyDown={createKeyboardNavHandler(
                  variant === 'admin' ? ADMIN_ROUTES.opsDevices : SUPERADMIN_ROUTES.opsDevices
                )}
              />
            </Grid>

            <Grid item xs={12} sm={variant === 'admin' ? 4 : 6} md={variant === 'admin' ? undefined : 3}>
              <DashboardMetricCard
                value={stats.overview.activeSessions || 0}
                label="Active sessions"
                icon={<BatteryChargingFullIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />}
                ariaLabel="Open sessions"
                onClick={() =>
                  navigate(variant === 'admin' ? ADMIN_ROUTES.opsSessions : SUPERADMIN_ROUTES.opsSessions)
                }
                onKeyDown={createKeyboardNavHandler(
                  variant === 'admin' ? ADMIN_ROUTES.opsSessions : SUPERADMIN_ROUTES.opsSessions
                )}
                hoverAccent="info"
              />
            </Grid>

            <Grid item xs={12} sm={variant === 'admin' ? 4 : 6} md={variant === 'admin' ? undefined : 3}>
              <DashboardMetricCard
                value={formatCurrency(stats.overview.totalRevenue ?? 0, 'GHS')}
                label="Total revenue"
                icon={
                  variant === 'admin' ? (
                    <AttachMoneyIcon sx={{ fontSize: 40, color: 'secondary.main', opacity: 0.7 }} />
                  ) : (
                    <AttachMoneyIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
                  )
                }
                ariaLabel="Open revenue reports"
                onClick={() => navigate(variant === 'admin' ? ADMIN_ROUTES.reports : SUPERADMIN_ROUTES.reports)}
                onKeyDown={createKeyboardNavHandler(
                  variant === 'admin' ? ADMIN_ROUTES.reports : SUPERADMIN_ROUTES.reports
                )}
                hoverAccent={variant === 'admin' ? 'secondary' : 'info'}
                valueSx={currencyValueSx}
              />
            </Grid>
          </Grid>

          {variant === 'superadmin' && stats.connectionHealth ? (
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
          ) : null}
        </>
      ) : null}
    </Box>
  );
}
