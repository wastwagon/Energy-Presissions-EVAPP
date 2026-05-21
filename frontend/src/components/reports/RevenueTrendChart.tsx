import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Paper, Typography, useTheme } from '@mui/material';
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

function formatAxisDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface RevenueTrendChartProps {
  days?: number;
  title?: string;
}

export function RevenueTrendChart({ days = 30, title = 'Revenue trend' }: RevenueTrendChartProps) {
  const theme = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const [points, setPoints] = useState<RevenueTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await dashboardApi.getRevenueTrend(days);
      setPoints(data.points ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load revenue trend');
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

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
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          Loading trend…
        </Typography>
      )}

      {!loading && !error && !hasRevenue && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No billed revenue in this period yet.
        </Typography>
      )}

      {!loading && hasRevenue && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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
                    if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                    return [value, 'Sessions'];
                  }}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as RevenueTrendPoint & { label: string };
                    return row?.date ? formatAxisDate(row.date) : '';
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill={theme.palette.success.main}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={!reducedMotion}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </>
      )}
    </Paper>
  );
}
