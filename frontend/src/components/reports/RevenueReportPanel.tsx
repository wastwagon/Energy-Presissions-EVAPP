import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { dashboardApi, type DashboardStats } from '../../services/dashboardApi';
import { reportsApi } from '../../services/dashboardApi';
import type { Transaction } from '../../services/transactionsApi';
import { premiumPanelCardSx } from '../../theme/jampackShell';
import { formatCurrency } from '../../utils/formatters';
import { isNoEnergyCompleted } from '../../utils/sessionDisplay';
import { GroupedListSection } from '../ios/GroupedListSection';
import { GroupedDetailRow } from '../ios/GroupedDetailRow';
import { StaffMetricCard } from '../dashboard/StaffMetricCard';
import { StaffPeriodChips, type StaffPeriodDays } from '../dashboard/StaffPeriodChips';
import { StaffFilterBar } from '../dashboard/StaffFilterBar';
import { RevenueTrendChart } from './RevenueTrendChart';
import { filterTransactionsByPeriodDays, reportExportFilename } from '../../utils/reportPeriod';
import { compactContainedCtaSx, sxObject } from '../../styles/authShell';
import { compareRevenueTrend } from '../../utils/revenueTrendCompare';
import { useOpsBasePath } from '../../hooks/useOpsBasePath';

function downloadRevenueCsv(
  rows: { label: string; count: number; amount: number }[],
  filename: string,
) {
  const lines = ['Category,Sessions,Amount (GHS)', ...rows.map((r) => `"${r.label}",${r.count},${r.amount.toFixed(2)}`)];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface RevenueReportPanelProps {
  vendorId?: number;
  loadStats?: () => Promise<DashboardStats>;
  /** Controlled period from parent reports page */
  periodDays?: StaffPeriodDays;
  onPeriodChange?: (days: StaffPeriodDays) => void;
  /** Hide local period chips when parent toolbar owns period */
  hidePeriodControls?: boolean;
}

export function RevenueReportPanel({
  vendorId,
  loadStats,
  periodDays: controlledDays,
  onPeriodChange,
  hidePeriodControls = false,
}: RevenueReportPanelProps) {
  const navigate = useNavigate();
  const opsBase = useOpsBasePath();
  const theme = useTheme();
  const useGrouped = useMediaQuery(theme.breakpoints.down('md'));
  const [localDays, setLocalDays] = useState<StaffPeriodDays>(30);
  const periodDays = controlledDays ?? localDays;
  const setPeriodDays = onPeriodChange ?? setLocalDays;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendPoints, setTrendPoints] = useState<Awaited<ReturnType<typeof dashboardApi.getRevenueTrend>>['points']>([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendError, setTrendError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const [statsData, sessionData] = await Promise.all([
        loadStats ? loadStats() : vendorId != null ? dashboardApi.getVendorStats() : dashboardApi.getStats(),
        reportsApi.getSessionRows(200, 0, vendorId),
      ]);
      setStats(statsData);
      setSessions(sessionData.transactions);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  }, [loadStats, vendorId]);

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
    void load();
  }, [load]);

  useEffect(() => {
    void loadTrend();
  }, [loadTrend]);

  const periodSessions = useMemo(
    () => filterTransactionsByPeriodDays(sessions, periodDays),
    [sessions, periodDays],
  );

  const breakdown = useMemo(() => {
    const completed = periodSessions.filter((t) => t.status === 'Completed');
    const withRevenue = completed.filter((t) => Number(t.totalCost) > 0);
    const noEnergy = completed.filter((t) => isNoEnergyCompleted(t));
    const zeroCost = completed.filter((t) => !Number(t.totalCost));
    const active = periodSessions.filter((t) => t.status === 'Active');
    const revenueSum = withRevenue.reduce((s, t) => s + Number(t.totalCost || 0), 0);
    return { completed, withRevenue, noEnergy, zeroCost, active, revenueSum };
  }, [periodSessions]);

  const trendCompare = useMemo(() => compareRevenueTrend(trendPoints), [trendPoints]);

  const summaryRows = useMemo(
    () => [
      {
        label: 'Completed (billed)',
        count: breakdown.withRevenue.length,
        amount: breakdown.revenueSum,
      },
      {
        label: 'Completed · no energy',
        count: breakdown.noEnergy.length,
        amount: 0,
      },
      {
        label: 'Completed · GH₵0',
        count: breakdown.zeroCost.length,
        amount: 0,
      },
      {
        label: 'Active (in progress)',
        count: breakdown.active.length,
        amount: 0,
      },
    ],
    [breakdown],
  );

  const pendingHolds = stats?.overview?.pendingWalletReserved ?? 0;

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {!hidePeriodControls ? (
        <StaffFilterBar aria-label="Revenue period and export" sx={{ mb: 2 }}>
          <StaffPeriodChips value={periodDays} onChange={setPeriodDays} disabled={loading || trendLoading} />
          <Button
            variant="contained"
            disableElevation
            size="small"
            startIcon={<DownloadIcon />}
            disabled={loading}
            onClick={() => downloadRevenueCsv(summaryRows, reportExportFilename('revenue-summary', periodDays))}
            sx={(th) => ({
              ...sxObject(th, compactContainedCtaSx),
              ml: { xs: 0, sm: 'auto' },
              width: { xs: '100%', sm: 'auto' },
              minHeight: 44,
            })}
          >
            Export summary
          </Button>
        </StaffFilterBar>
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: { xs: 'stretch', sm: 'flex-end' },
            mb: 2,
          }}
        >
          <Button
            variant="contained"
            disableElevation
            size="small"
            startIcon={<DownloadIcon />}
            disabled={loading}
            onClick={() => downloadRevenueCsv(summaryRows, reportExportFilename('revenue-summary', periodDays))}
            sx={(th) => ({
              ...sxObject(th, compactContainedCtaSx),
              width: { xs: '100%', sm: 'auto' },
              minHeight: 44,
            })}
          >
            Export summary
          </Button>
        </Box>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Period totals use completed billed sessions in the last {periodDays} days. Wallet holds are not revenue until
        the session finalizes.
      </Typography>

      {loading ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          Loading revenue…
        </Typography>
      ) : (
        <>
          <Grid container spacing={{ xs: 2, sm: 2 }} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <StaffMetricCard
                label={`Revenue (${periodDays}d)`}
                value={formatCurrency(trendCompare.periodRevenue || breakdown.revenueSum)}
                trendPercent={trendCompare.revenueTrendPercent}
                sparklineValues={trendCompare.sparkRevenue}
                tone="brand"
              />
            </Grid>
            {pendingHolds > 0 && (
              <Grid item xs={12} sm={6}>
                <StaffMetricCard
                  label="Pending wallet holds"
                  value={formatCurrency(pendingHolds)}
                  hint="Not counted in revenue until sessions complete"
                  tone="warning"
                />
              </Grid>
            )}
          </Grid>

          <Box sx={{ mb: 2 }}>
            <RevenueTrendChart
              days={periodDays}
              title="Revenue trend"
              points={trendPoints}
              loading={trendLoading}
              error={trendError}
              onDaySelect={(date) => navigate(`${opsBase}/sessions?date=${encodeURIComponent(date)}`)}
              emptyAction={{
                label: 'Open sessions',
                onClick: () => navigate(`${opsBase}/sessions`),
              }}
            />
          </Box>

          {useGrouped ? (
            <GroupedListSection title={`Breakdown (last ${periodDays}d sample)`}>
              {summaryRows.map((row, index) => (
                <GroupedDetailRow
                  key={row.label}
                  label={`${row.label} (${row.count})`}
                  value={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(row.amount)}
                    </Typography>
                  }
                  divider={index < summaryRows.length - 1}
                />
              ))}
            </GroupedListSection>
          ) : (
            <Grid container spacing={2}>
              {summaryRows.map((row) => (
                <Grid item xs={12} sm={6} md={3} key={row.label}>
                  <Paper sx={premiumPanelCardSx}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {row.label}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                      {row.count} sessions
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {formatCurrency(row.amount)}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
}
