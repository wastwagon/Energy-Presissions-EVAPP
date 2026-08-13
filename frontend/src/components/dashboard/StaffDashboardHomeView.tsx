import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Typography, Grid, Alert, Link, Stack } from '@mui/material';
import EvStationIcon from '@mui/icons-material/EvStation';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import BusinessIcon from '@mui/icons-material/Business';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { useNavigate } from 'react-router-dom';
import { useDashboardRealtime } from '../../hooks/useDashboardRealtime';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useStaffPullRefresh } from '../../hooks/useStaffPullRefresh';
import { staffLargeSubtitleSx, staffLargeTitleSx } from '../../theme/staffChrome';
import { compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { formatCurrency } from '../../utils/formatters';
import { LivePageHeader } from './LivePageHeader';
import { ADMIN_ROUTES, SUPERADMIN_ROUTES } from '../../config/staffNav.paths';
import { StaffMetricCard } from './StaffMetricCard';
import { StaffPeriodChips, type StaffPeriodDays } from './StaffPeriodChips';
import { StaffDashboardRecentSessions } from './StaffDashboardRecentSessions';
import { DashboardStaffHomeSkeleton } from './DashboardStaffHomeSkeleton';
import { RevenueTrendChart } from '../reports/RevenueTrendChart';
import { dashboardApi, type RevenueTrendPoint } from '../../services/dashboardApi';
import { compareRevenueTrend } from '../../utils/revenueTrendCompare';

type StaffDashboardVariant = 'admin' | 'superadmin';

export function StaffDashboardHomeView({ variant }: { variant: StaffDashboardVariant }) {
  const navigate = useNavigate();
  const { stats, loading, refreshing, error, updatedAt, loadStats, setError } = useDashboardStats();
  const [periodDays, setPeriodDays] = useState<StaffPeriodDays>(30);
  const [trendPoints, setTrendPoints] = useState<RevenueTrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendError, setTrendError] = useState<string | null>(null);

  const loadTrend = useCallback(async () => {
    try {
      setTrendError(null);
      setTrendLoading(true);
      const data = await dashboardApi.getRevenueTrend(periodDays);
      setTrendPoints(data.points ?? []);
    } catch (err: unknown) {
      setTrendError(err instanceof Error ? err.message : 'Failed to load revenue trend');
      setTrendPoints([]);
    } finally {
      setTrendLoading(false);
    }
  }, [periodDays]);

  useEffect(() => {
    void loadTrend();
  }, [loadTrend]);

  const refreshAll = useCallback(
    async (silent?: boolean) => {
      await Promise.all([loadStats(silent), loadTrend()]);
    },
    [loadStats, loadTrend],
  );

  useDashboardRealtime(
    useCallback(() => void refreshAll(true), [refreshAll]),
    variant === 'superadmin' ? 'superadmin' : 'admin',
  );

  useStaffPullRefresh(useCallback(() => void refreshAll(false), [refreshAll]));

  const trendCompare = useMemo(() => compareRevenueTrend(trendPoints), [trendPoints]);

  const createKeyboardNavHandler =
    (path: string) => (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        navigate(path);
      }
    };

  const chargePointHint = useMemo(() => {
    const rows = stats?.breakdowns?.chargePointsByStatus;
    if (!rows?.length) return undefined;
    const top = [...rows].sort((a, b) => b.count - a.count).slice(0, 2);
    return top.map((r) => `${r.count} ${r.status}`).join(' · ');
  }, [stats?.breakdowns?.chargePointsByStatus]);

  if (loading) {
    return <DashboardStaffHomeSkeleton variant={variant} />;
  }

  const title = variant === 'admin' ? 'Admin Dashboard' : 'Super Admin Dashboard';
  const subtitle =
    variant === 'admin'
      ? "Manage your vendor's charging operations and settings"
      : 'Complete system control and management across all vendors and users';

  const devicesPath = variant === 'admin' ? ADMIN_ROUTES.opsDevices : SUPERADMIN_ROUTES.opsDevices;
  const sessionsPath = variant === 'admin' ? ADMIN_ROUTES.opsSessions : SUPERADMIN_ROUTES.opsSessions;
  const reportsPath = variant === 'admin' ? ADMIN_ROUTES.reports : SUPERADMIN_ROUTES.reports;

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title={title}
        subtitle={subtitle}
        updatedAt={updatedAt}
        showSeconds
        refreshing={refreshing || trendLoading}
        refreshDisabled={loading}
        onRefresh={() => void refreshAll(false)}
        titleVariant="large"
        titleSx={staffLargeTitleSx}
        subtitleSx={staffLargeSubtitleSx}
        showToolbarRefreshOnMobile
        refreshSx={(th) => ({
          ...sxObject(th, compactOutlinedCtaSx),
          width: { xs: '100%', sm: 'auto' },
          alignSelf: { xs: 'stretch', sm: 'flex-start' },
        })}
        actions={
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <StaffPeriodChips value={periodDays} onChange={setPeriodDays} disabled={trendLoading} />
          </Stack>
        }
      />

      {error != null ? (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {stats != null ? (
        <>
          <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 2.5 }}>
            {variant === 'superadmin' ? (
              <Grid item xs={12} sm={6} md={3}>
                <StaffMetricCard
                  label="Vendors"
                  value={stats.overview.totalVendors || 0}
                  icon={<BusinessIcon />}
                  hint="Network operators"
                  ariaLabel="Open vendors"
                  onClick={() => navigate(SUPERADMIN_ROUTES.vendors)}
                  onKeyDown={createKeyboardNavHandler(SUPERADMIN_ROUTES.vendors)}
                />
              </Grid>
            ) : null}

            <Grid item xs={12} sm={6} md={3}>
              <StaffMetricCard
                label="Charge points"
                value={stats.overview.totalChargePoints || 0}
                icon={<EvStationIcon />}
                hint={chargePointHint}
                ariaLabel="Open devices"
                onClick={() => navigate(devicesPath)}
                onKeyDown={createKeyboardNavHandler(devicesPath)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StaffMetricCard
                label="Active sessions"
                value={stats.overview.activeSessions || 0}
                icon={<BatteryChargingFullIcon />}
                hint="Live now"
                tone={stats.overview.activeSessions > 0 ? 'info' : 'default'}
                ariaLabel="Open sessions"
                onClick={() => navigate(sessionsPath)}
                onKeyDown={createKeyboardNavHandler(sessionsPath)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StaffMetricCard
                label={`Revenue (${periodDays}d)`}
                value={formatCurrency(trendCompare.periodRevenue, 'GHS')}
                icon={<AttachMoneyIcon />}
                trendPercent={trendCompare.revenueTrendPercent}
                sparklineValues={trendCompare.sparkRevenue}
                sparklineLabel="Revenue sparkline"
                hint={
                  variant === 'admin'
                    ? 'Completed billed sessions'
                    : 'Network completed billed sessions'
                }
                ariaLabel="Open revenue reports"
                onClick={() => navigate(reportsPath)}
                onKeyDown={createKeyboardNavHandler(reportsPath)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StaffMetricCard
                label={`Sessions (${periodDays}d)`}
                value={trendCompare.periodSessions}
                icon={<ShowChartIcon />}
                trendPercent={trendCompare.sessionsTrendPercent}
                sparklineValues={trendCompare.sparkSessions}
                sparklineLabel="Sessions sparkline"
                hint="Completed in selected period"
                ariaLabel="Open sessions"
                onClick={() => navigate(sessionsPath)}
                onKeyDown={createKeyboardNavHandler(sessionsPath)}
              />
            </Grid>
          </Grid>

          {variant === 'admin' && (stats.overview.pendingWalletReserved ?? 0) > 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: -1, mb: 2 }}>
              {formatCurrency(stats.overview.pendingWalletReserved ?? 0)} in pending wallet holds — not
              counted in revenue until sessions complete.{' '}
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate(ADMIN_ROUTES.billing)}
                sx={{ verticalAlign: 'baseline', p: 0, minWidth: 0 }}
              >
                Billing & invoices
              </Link>
            </Typography>
          ) : null}

          {variant === 'admin' && (stats.overview.pendingWalletReserved ?? 0) === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: -1, mb: 2 }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate(ADMIN_ROUTES.analytics)}
                sx={{ verticalAlign: 'baseline', p: 0, minWidth: 0, mr: 1 }}
              >
                Analytics
              </Link>
              ·{' '}
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => navigate(ADMIN_ROUTES.billing)}
                sx={{ verticalAlign: 'baseline', p: 0, minWidth: 0 }}
              >
                Billing & invoices
              </Link>
            </Typography>
          ) : null}

          {variant === 'superadmin' && stats.connectionHealth ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: -1, mb: 2 }}>
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

          {variant === 'superadmin' && (stats.overview.pendingWalletReserved ?? 0) > 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0, mb: 2 }}>
              Pending wallet holds network-wide: {formatCurrency(stats.overview.pendingWalletReserved ?? 0)}
            </Typography>
          ) : null}

          <Box sx={{ mb: 2.5 }}>
            <RevenueTrendChart
              days={periodDays}
              title="Revenue trend"
              points={trendPoints}
              loading={trendLoading}
              error={trendError}
            />
          </Box>

          <StaffDashboardRecentSessions variant={variant} refreshKey={updatedAt ?? 0} />
        </>
      ) : null}
    </Box>
  );
}
