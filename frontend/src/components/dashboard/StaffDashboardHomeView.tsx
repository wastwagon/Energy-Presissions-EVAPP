import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Typography, Grid, Alert, Link, Stack, Button } from '@mui/material';
import EvStationIcon from '@mui/icons-material/EvStation';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import BusinessIcon from '@mui/icons-material/Business';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';
import { useDashboardRealtime } from '../../hooks/useDashboardRealtime';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useStaffPullRefresh } from '../../hooks/useStaffPullRefresh';
import { staffLargeSubtitleSx, staffLargeTitleSx } from '../../theme/staffChrome';
import { compactOutlinedCtaSx, compactContainedCtaSx, sxObject } from '../../styles/authShell';
import { formatCurrency } from '../../utils/formatters';
import {
  buildStaffDashboardInsight,
  countChargePointsByStatus,
} from '../../utils/staffDashboardInsight';
import { LivePageHeader } from './LivePageHeader';
import { ADMIN_ROUTES, SUPERADMIN_ROUTES } from '../../config/staffNav.paths';
import { StaffMetricCard } from './StaffMetricCard';
import { StaffPeriodChips, type StaffPeriodDays } from './StaffPeriodChips';
import { StaffDashboardRecentSessions } from './StaffDashboardRecentSessions';
import { DashboardStaffHomeSkeleton } from './DashboardStaffHomeSkeleton';
import { RevenueTrendChart } from '../reports/RevenueTrendChart';
import { dashboardApi, type RevenueTrendPoint } from '../../services/dashboardApi';
import { StaffFirstRunChecklist } from './StaffFirstRunChecklist';
import { compareRevenueTrend } from '../../utils/revenueTrendCompare';
import { vendorApi, type VendorPayoutSummary } from '../../services/vendorApi';
import { VendorPayoutSummaryCard } from '../vendor/VendorPayoutSummaryCard';

type StaffDashboardVariant = 'admin' | 'superadmin' | 'vendor';

export function StaffDashboardHomeView({ variant }: { variant: StaffDashboardVariant }) {
  const navigate = useNavigate();
  const { stats, loading, refreshing, error, updatedAt, loadStats, setError } = useDashboardStats();
  const [periodDays, setPeriodDays] = useState<StaffPeriodDays>(30);
  const [trendPoints, setTrendPoints] = useState<RevenueTrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendError, setTrendError] = useState<string | null>(null);
  const [payoutSummary, setPayoutSummary] = useState<VendorPayoutSummary | null>(null);
  const [payoutLoading, setPayoutLoading] = useState(false);

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

  useEffect(() => {
    if (variant === 'superadmin') return;
    let cancelled = false;
    setPayoutLoading(true);
    void vendorApi
      .getOwnPayoutSummary()
      .then((data) => {
        if (!cancelled) setPayoutSummary(data);
      })
      .catch(() => {
        if (!cancelled) setPayoutSummary(null);
      })
      .finally(() => {
        if (!cancelled) setPayoutLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [variant]);

  const refreshAll = useCallback(
    async (silent?: boolean) => {
      const tasks: Promise<unknown>[] = [loadStats(silent), loadTrend()];
      if (variant !== 'superadmin') {
        tasks.push(
          vendorApi
            .getOwnPayoutSummary()
            .then(setPayoutSummary)
            .catch(() => setPayoutSummary(null)),
        );
      }
      await Promise.all(tasks);
    },
    [loadStats, loadTrend, variant],
  );

  useDashboardRealtime(
    useCallback(() => void refreshAll(true), [refreshAll]),
    variant === 'superadmin' ? 'superadmin' : 'admin',
  );

  useStaffPullRefresh(useCallback(() => void refreshAll(false), [refreshAll]));

  const trendCompare = useMemo(() => compareRevenueTrend(trendPoints), [trendPoints]);
  const trendCaption = `vs earlier in ${periodDays} days`;

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

  const offlineCount = useMemo(
    () => countChargePointsByStatus(stats?.breakdowns?.chargePointsByStatus, /offline/i),
    [stats?.breakdowns?.chargePointsByStatus],
  );

  const insight = useMemo(() => {
    if (!stats) return null;
    return buildStaffDashboardInsight({
      periodDays,
      revenueTrendPercent: trendCompare.revenueTrendPercent,
      offlineCount,
      activeSessions: stats.overview.activeSessions || 0,
      pendingWalletReserved: stats.overview.pendingWalletReserved ?? 0,
      devicesWithErrors: stats.connectionHealth?.devicesWithErrors,
      moneyNoun: variant === 'superadmin' ? 'Revenue' : 'Sales',
    });
  }, [stats, periodDays, trendCompare.revenueTrendPercent, offlineCount, variant]);

  if (loading) {
    return <DashboardStaffHomeSkeleton variant={variant === 'superadmin' ? 'superadmin' : 'admin'} />;
  }

  const title =
    variant === 'superadmin' ? 'Super Admin Dashboard' : variant === 'vendor' ? 'Vendor home' : 'Dashboard';
  const subtitle =
    variant === 'superadmin'
      ? 'Network control across vendors — one hero metric, then what needs attention.'
      : 'Sales for the selected period, plus the matured amount on your next payout.';

  const isNetwork = variant === 'superadmin';
  const devicesPath = isNetwork ? SUPERADMIN_ROUTES.opsDevices : ADMIN_ROUTES.opsDevices;
  const sessionsPath = isNetwork ? SUPERADMIN_ROUTES.opsSessions : ADMIN_ROUTES.opsSessions;
  const analyticsPath = isNetwork ? SUPERADMIN_ROUTES.analytics : ADMIN_ROUTES.analytics;
  const billingPath = isNetwork ? SUPERADMIN_ROUTES.billing : ADMIN_ROUTES.billing;
  const sessionsVariant = isNetwork ? 'superadmin' : 'admin';

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
            {variant === 'vendor' ? (
              <Button
                variant="contained"
                disableElevation
                startIcon={<SettingsIcon />}
                onClick={() => navigate(ADMIN_ROUTES.vendorSettings)}
                sx={(th) => ({
                  ...sxObject(th, compactContainedCtaSx),
                  width: { xs: '100%', sm: 'auto' },
                })}
              >
                Settings
              </Button>
            ) : null}
          </Stack>
        }
      />

      {error != null ? (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {variant !== 'superadmin' && (payoutLoading || payoutSummary) ? (
        <Box sx={{ mb: 2.5 }}>
          <VendorPayoutSummaryCard summary={payoutSummary} loading={payoutLoading} />
        </Box>
      ) : null}

      {stats != null && (stats.overview.totalChargePoints || 0) === 0 ? (
        <StaffFirstRunChecklist variant={variant} />
      ) : null}

      {stats != null ? (
        <>
          {variant !== 'superadmin' ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Sales below are for the last {periodDays} days. Next payout above is matured sales, not this filter.
            </Typography>
          ) : null}
          <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6} lg={5}>
              <StaffMetricCard
                size="hero"
                label={isNetwork ? `Revenue (${periodDays} days)` : `Sales (${periodDays} days)`}
                value={formatCurrency(trendCompare.periodRevenue, 'GHS')}
                icon={<AttachMoneyIcon />}
                trendPercent={trendCompare.revenueTrendPercent}
                trendCaption={trendCaption}
                sparklineValues={trendCompare.sparkRevenue}
                sparklineLabel={isNetwork ? 'Revenue sparkline' : 'Sales sparkline'}
                hint={
                  isNetwork
                    ? 'Network completed billed sessions'
                    : 'Completed sessions at your chargers in the selected period'
                }
                ariaLabel="Open analytics"
                onClick={() => navigate(analyticsPath)}
                onKeyDown={createKeyboardNavHandler(analyticsPath)}
              />
            </Grid>
            <Grid item xs={12} md={6} lg={7}>
              <Grid container spacing={{ xs: 2, sm: 2.5 }}>
                {isNetwork ? (
                  <Grid item xs={12} sm={6}>
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

                <Grid item xs={12} sm={6}>
                  <StaffMetricCard
                    label="Charge points"
                    value={stats.overview.totalChargePoints || 0}
                    icon={<EvStationIcon />}
                    hint={chargePointHint}
                    tone={offlineCount > 0 ? 'warning' : 'default'}
                    ariaLabel="Open devices"
                    onClick={() => navigate(devicesPath)}
                    onKeyDown={createKeyboardNavHandler(devicesPath)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
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

                <Grid item xs={12} sm={6}>
                  <StaffMetricCard
                    label={`Sessions (${periodDays} days)`}
                    value={trendCompare.periodSessions}
                    icon={<ShowChartIcon />}
                    trendPercent={trendCompare.sessionsTrendPercent}
                    trendCaption={trendCaption}
                    sparklineValues={trendCompare.sparkSessions}
                    sparklineLabel="Sessions sparkline"
                    hint="Completed in selected period"
                    ariaLabel="Open sessions"
                    onClick={() => navigate(sessionsPath)}
                    onKeyDown={createKeyboardNavHandler(sessionsPath)}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {insight ? (
            <Typography variant="body2" sx={{ mb: 1.5, color: 'text.primary', fontWeight: 500 }}>
              {insight}
            </Typography>
          ) : null}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => navigate(analyticsPath)}
              sx={{ verticalAlign: 'baseline', p: 0, minWidth: 0, mr: 1 }}
            >
              Analytics
            </Link>
            ·{' '}
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => navigate(billingPath)}
              sx={{ verticalAlign: 'baseline', p: 0, minWidth: 0, mx: 1 }}
            >
              Billing
            </Link>
            {isNetwork && stats.connectionHealth ? (
              <>
                ·{' '}
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => navigate(SUPERADMIN_ROUTES.health)}
                  sx={{ verticalAlign: 'baseline', p: 0, minWidth: 0, ml: 1 }}
                >
                  System health
                </Link>
              </>
            ) : null}
            {variant !== 'superadmin' ? (
              <>
                ·{' '}
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => navigate(ADMIN_ROUTES.vendorSettings)}
                  sx={{ verticalAlign: 'baseline', p: 0, minWidth: 0, ml: 1 }}
                >
                  Vendor settings
                </Link>
              </>
            ) : null}
          </Typography>

          <Box sx={{ mb: 2.5 }}>
            <RevenueTrendChart
              days={periodDays}
              title={isNetwork ? 'Revenue trend' : 'Sales trend'}
              moneyLabel={isNetwork ? 'Revenue' : 'Sales'}
              points={trendPoints}
              loading={trendLoading}
              error={trendError}
              onDaySelect={(date) => navigate(`${sessionsPath}?date=${encodeURIComponent(date)}`)}
              emptyAction={{ label: 'Open sessions', onClick: () => navigate(sessionsPath) }}
            />
          </Box>

          <StaffDashboardRecentSessions variant={sessionsVariant} refreshKey={updatedAt ?? 0} />
        </>
      ) : null}
    </Box>
  );
}
