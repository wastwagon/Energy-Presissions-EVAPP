import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import { Box, Grid, Alert, Button, Stack } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EvStationIcon from '@mui/icons-material/EvStation';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import BusinessIcon from '@mui/icons-material/Business';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import axios from 'axios';
import { dashboardApi, DashboardStats, type RevenueTrendPoint } from '../../services/dashboardApi';
import { staffLargeSubtitleSx, staffLargeTitleSx } from '../../theme/staffChrome';
import { compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { websocketService } from '../../services/websocket';
import { formatCurrency } from '../../utils/formatters';
import { compareRevenueTrend } from '../../utils/revenueTrendCompare';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { StaffMetricCard } from '../../components/dashboard/StaffMetricCard';
import { StaffPeriodChips, type StaffPeriodDays } from '../../components/dashboard/StaffPeriodChips';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { DashboardStaffChromeSkeleton } from '../../components/dashboard/DashboardStaffChromeSkeleton';
import { AnalyticsBreakdownPanel } from '../../components/reports/AnalyticsBreakdownPanel';
import { RevenueTrendChart } from '../../components/reports/RevenueTrendChart';
import { ADMIN_ROUTES, SUPERADMIN_ROUTES } from '../../config/staffNav.paths';

export type StaffAnalyticsVariant = 'admin' | 'superadmin';

export function StaffAnalyticsPage({ variant = 'superadmin' }: { variant?: StaffAnalyticsVariant }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vendorScope = variant === 'superadmin' && searchParams.get('scope') === 'vendor';
  const showVendorsKpi = variant === 'superadmin' && !vendorScope;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [periodDays, setPeriodDays] = useState<StaffPeriodDays>(30);
  const [trendPoints, setTrendPoints] = useState<RevenueTrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendError, setTrendError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const statsRef = useRef<DashboardStats | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadTrend = useCallback(async () => {
    try {
      setTrendError(null);
      setTrendLoading(true);
      const data = await dashboardApi.getRevenueTrend(periodDays);
      if (mountedRef.current) setTrendPoints(data.points ?? []);
    } catch (err: unknown) {
      if (mountedRef.current) {
        setTrendError(err instanceof Error ? err.message : 'Failed to load revenue trend');
        setTrendPoints([]);
      }
    } finally {
      if (mountedRef.current) setTrendLoading(false);
    }
  }, [periodDays]);

  const loadAnalytics = useCallback(async (silent?: boolean) => {
    const isQuiet = silent === true;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (!mountedRef.current) return;

      if (isQuiet) {
        setRefreshing(true);
      } else if (statsRef.current == null) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const data = await dashboardApi.getStats({ signal: controller.signal });
      if (mountedRef.current) {
        statsRef.current = data;
        setStats(data);
        setUpdatedAt(Date.now());
      }
    } catch (err: unknown) {
      if (axios.isCancel(err)) return;
      console.error('Error loading analytics:', err);
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load analytics';
        setError(message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const refreshAll = useCallback(
    async (silent?: boolean) => {
      await Promise.all([loadAnalytics(silent), loadTrend()]);
    },
    [loadAnalytics, loadTrend],
  );

  useEffect(() => {
    void loadTrend();
  }, [loadTrend]);

  useEffect(() => {
    void loadAnalytics(false);
    return () => {
      abortRef.current?.abort();
    };
  }, [loadAnalytics]);

  useEffect(() => {
    const unsubscribeTransactionStarted = websocketService.on('transactionStarted', () => {
      void loadAnalytics(true);
      void loadTrend();
    });

    const unsubscribeTransactionStopped = websocketService.on('transactionStopped', () => {
      void loadAnalytics(true);
      void loadTrend();
    });

    const unsubscribeDashboardStats = websocketService.on('dashboardStatsUpdate', () => {
      void loadAnalytics(true);
      void loadTrend();
    });

    return () => {
      unsubscribeTransactionStarted();
      unsubscribeTransactionStopped();
      unsubscribeDashboardStats();
    };
  }, [loadAnalytics, loadTrend]);

  const trendCompare = useMemo(() => compareRevenueTrend(trendPoints), [trendPoints]);
  const trendCaption = `vs earlier in ${periodDays} days`;
  const isVendorView = variant === 'admin' || vendorScope;
  const moneyLabel = isVendorView ? 'Sales' : 'Revenue';

  const createKeyboardNavHandler =
    (path: string) => (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        navigate(path);
      }
    };

  if (loading) {
    return <DashboardStaffChromeSkeleton preset="analytics" />;
  }

  const devicesPath = variant === 'admin' ? ADMIN_ROUTES.opsDevices : SUPERADMIN_ROUTES.opsDevices;
  const sessionsPath = variant === 'admin' ? ADMIN_ROUTES.opsSessions : SUPERADMIN_ROUTES.opsSessions;
  const reportsPath = variant === 'admin' ? ADMIN_ROUTES.reports : SUPERADMIN_ROUTES.reports;
  const billingPath = variant === 'admin' ? ADMIN_ROUTES.billing : SUPERADMIN_ROUTES.billing;

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title={
          variant === 'admin'
            ? 'Analytics'
            : vendorScope
              ? 'Vendor analytics'
              : 'System analytics'
        }
        subtitle={
          variant === 'admin'
            ? 'Same period as Dashboard — sales trend and operational breakdowns. Exports live in Reports.'
            : vendorScope
              ? 'Period trend for the current vendor context. Open Reports to export.'
              : 'Network trend and mix across vendors. Open Reports to export.'
        }
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.analytics}
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {stats && (
        <>
          <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={{ mb: 2.5 }}>
            <Grid item xs={12} sm={6} md={showVendorsKpi ? 4 : 3}>
              <StaffMetricCard
                label={`${moneyLabel} (${periodDays} days)`}
                value={formatCurrency(trendCompare.periodRevenue)}
                hint="Completed billed sessions in this period"
                icon={<TrendingUpIcon />}
                trendPercent={trendCompare.revenueTrendPercent}
                trendCaption={trendCaption}
                sparklineValues={trendCompare.sparkRevenue}
                sparklineLabel={`${moneyLabel} sparkline`}
                ariaLabel="Open reports to export"
                onClick={() => navigate(reportsPath)}
                onKeyDown={createKeyboardNavHandler(reportsPath)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={showVendorsKpi ? 4 : 3}>
              <StaffMetricCard
                label={`Sessions (${periodDays} days)`}
                value={trendCompare.periodSessions}
                icon={<ShowChartIcon />}
                hint="Completed in selected period"
                trendPercent={trendCompare.sessionsTrendPercent}
                trendCaption={trendCaption}
                sparklineValues={trendCompare.sparkSessions}
                sparklineLabel="Sessions sparkline"
                ariaLabel="Open sessions"
                onClick={() => navigate(sessionsPath)}
                onKeyDown={createKeyboardNavHandler(sessionsPath)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={showVendorsKpi ? 4 : 3}>
              <StaffMetricCard
                label="Active sessions"
                value={stats.overview?.activeSessions || 0}
                icon={<BatteryChargingFullIcon />}
                hint="Live now"
                tone={stats.overview?.activeSessions ? 'info' : 'default'}
                ariaLabel="Open sessions"
                onClick={() => navigate(sessionsPath)}
                onKeyDown={createKeyboardNavHandler(sessionsPath)}
              />
            </Grid>
            {showVendorsKpi ? (
              <Grid item xs={12} sm={6} md={4}>
                <StaffMetricCard
                  label="Vendors"
                  value={stats.overview?.totalVendors || 0}
                  icon={<BusinessIcon />}
                  hint="Network operators"
                  ariaLabel="Open vendors"
                  onClick={() => navigate(SUPERADMIN_ROUTES.vendors)}
                  onKeyDown={createKeyboardNavHandler(SUPERADMIN_ROUTES.vendors)}
                />
              </Grid>
            ) : null}
            <Grid item xs={12} sm={6} md={showVendorsKpi ? 4 : 3}>
              <StaffMetricCard
                label="Charge points"
                value={stats.overview?.totalChargePoints || 0}
                icon={<EvStationIcon />}
                hint="Fleet size"
                ariaLabel="Open devices"
                onClick={() => navigate(devicesPath)}
                onKeyDown={createKeyboardNavHandler(devicesPath)}
              />
            </Grid>
          </Grid>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            sx={{ mb: 2.5 }}
          >
            <Button
              component={RouterLink}
              to={reportsPath}
              variant="outlined"
              size="small"
              sx={(th) => ({
                ...sxObject(th, compactOutlinedCtaSx),
                width: { xs: '100%', sm: 'auto' },
                minHeight: 44,
              })}
            >
              Export reports
            </Button>
            <Button
              component={RouterLink}
              to={billingPath}
              variant="outlined"
              size="small"
              sx={(th) => ({
                ...sxObject(th, compactOutlinedCtaSx),
                width: { xs: '100%', sm: 'auto' },
                minHeight: 44,
              })}
            >
              Billing & invoices
            </Button>
          </Stack>

          <Box sx={{ mb: 2.5 }}>
            <RevenueTrendChart
              days={periodDays}
              title={`${moneyLabel} trend`}
              moneyLabel={moneyLabel}
              points={trendPoints}
              loading={trendLoading}
              error={trendError}
              onDaySelect={(date) => navigate(`${sessionsPath}?date=${encodeURIComponent(date)}`)}
              emptyAction={{ label: 'Open sessions', onClick: () => navigate(sessionsPath) }}
            />
          </Box>
          <AnalyticsBreakdownPanel stats={stats} hideUserBreakdown={isVendorView} />
        </>
      )}
    </Box>
  );
}

export function SuperAdminAnalyticsPage() {
  return <StaffAnalyticsPage variant="superadmin" />;
}
