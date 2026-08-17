import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Paper, Skeleton, Typography, useTheme } from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { dashboardApi, type RevenueTrendPoint } from '../../services/dashboardApi';
import { premiumPanelCardSx } from '../../theme/jampackShell';
import { formatCurrency } from '../../utils/formatters';
import { usePrefersReducedMotion } from '../../utils/motionPreference';
import { AppEmptyState } from '../ui/AppEmptyState';

function formatAxisDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface RevenueTrendChartProps {
  days?: number;
  title?: string;
  /** Controlled mode — skip internal fetch when provided (including empty). */
  points?: RevenueTrendPoint[] | null;
  loading?: boolean;
  error?: string | null;
  /** Axis / tooltip / empty-state noun. Vendor dashboards use Sales. */
  moneyLabel?: string;
  onDaySelect?: (isoDate: string) => void;
  emptyAction?: { label: string; onClick: () => void };
}

export function RevenueTrendChart({
  days = 30,
  title = 'Revenue trend',
  moneyLabel = 'Revenue',
  points: controlledPoints,
  loading: controlledLoading,
  error: controlledError,
  onDaySelect,
  emptyAction,
}: RevenueTrendChartProps) {
  const theme = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const controlled = controlledPoints !== undefined;
  const [fetchedPoints, setFetchedPoints] = useState<RevenueTrendPoint[]>([]);
  const [fetchedLoading, setFetchedLoading] = useState(!controlled);
  const [fetchedError, setFetchedError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (controlled) return;
    try {
      setFetchedError(null);
      setFetchedLoading(true);
      const data = await dashboardApi.getRevenueTrend(days);
      setFetchedPoints(data.points ?? []);
    } catch (err: unknown) {
      setFetchedError(err instanceof Error ? err.message : 'Failed to load revenue trend');
      setFetchedPoints([]);
    } finally {
      setFetchedLoading(false);
    }
  }, [days, controlled]);

  useEffect(() => {
    void load();
  }, [load]);

  const points = controlled ? (controlledPoints ?? []) : fetchedPoints;
  const loading = controlled ? Boolean(controlledLoading) : fetchedLoading;
  const error = controlled ? (controlledError ?? null) : fetchedError;

  const chartData = useMemo(
    () =>
      points.map((p) => ({
        ...p,
        label: formatAxisDate(p.date),
      })),
    [points],
  );

  const totalRevenue = useMemo(
    () => points.reduce((sum, p) => sum + p.revenue, 0),
    [points],
  );

  const hasRevenue = totalRevenue > 0;

  return (
    <Paper sx={premiumPanelCardSx}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
        Last {days} days · completed sessions with billing (GH₵ &gt; 0)
        {onDaySelect ? ' · tap a day for sessions' : ''}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Skeleton
          variant="rounded"
          animation="wave"
          height={220}
          sx={{ width: '100%', mb: 1 }}
          aria-label={`Loading ${moneyLabel.toLowerCase()} trend`}
        />
      )}

      {!loading && !error && !hasRevenue && (
        <AppEmptyState
          sx={{ border: 0, boxShadow: 'none', borderRadius: 0, py: 2 }}
          icon={<ShowChartIcon />}
          title={`No billed ${moneyLabel.toLowerCase()} yet`}
          description={`No completed paid sessions in the last ${days} days.`}
          primaryAction={
            emptyAction
              ? { label: emptyAction.label, onClick: emptyAction.onClick, variant: 'secondary' }
              : undefined
          }
        />
      )}

      {!loading && hasRevenue && (
        <>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1, fontVariantNumeric: 'tabular-nums' }}
          >
            Period total: {formatCurrency(totalRevenue)}
          </Typography>
          <Box sx={{ width: '100%', height: { xs: 220, sm: 260 }, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                  width={40}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue') return [formatCurrency(value), moneyLabel];
                    return [value, 'Sessions'];
                  }}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as RevenueTrendPoint & { label: string };
                    return row?.date ? formatAxisDate(row.date) : '';
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill={theme.palette.primary.main}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={!reducedMotion}
                  cursor={onDaySelect ? 'pointer' : undefined}
                  onClick={(entry) => {
                    const date = (entry as { date?: string } | undefined)?.date;
                    if (date && onDaySelect) onDaySelect(date);
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </>
      )}
    </Paper>
  );
}
