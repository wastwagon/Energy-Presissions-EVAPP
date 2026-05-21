import { Box, Grid, Paper, Typography, useTheme } from '@mui/material';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardStats } from '../../services/dashboardApi';
import { premiumPanelCardSx } from '../../theme/jampackShell';
import { usePrefersReducedMotion } from '../../utils/motionPreference';

type ChartRow = { label: string; count: number };

interface AnalyticsBreakdownChartsProps {
  stats: DashboardStats;
}

function mapRows(rows: Array<{ type?: string; status?: string; count: number }>): ChartRow[] {
  return rows.map((row) => ({
    label: row.type ?? row.status ?? 'Unknown',
    count: row.count,
  }));
}

function BreakdownBarChart({
  title,
  rows,
  barColor,
  animate,
}: {
  title: string;
  rows: ChartRow[];
  barColor: string;
  animate: boolean;
}) {
  if (rows.length === 0) return null;

  return (
    <Paper sx={premiumPanelCardSx}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        {title}
      </Typography>
      <Box sx={{ width: '100%', height: { xs: Math.max(160, rows.length * 36), sm: 220 }, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
          >
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="label"
              width={88}
              tick={{ fontSize: 11 }}
              tickFormatter={(value: string) =>
                value.length > 14 ? `${value.slice(0, 12)}…` : value
              }
            />
            <Tooltip
              formatter={(value: number) => [value, 'Count']}
              labelFormatter={(label) => String(label)}
            />
            <Bar
              dataKey="count"
              fill={barColor}
              radius={[0, 4, 4, 0]}
              isAnimationActive={animate}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

function DeviceHealthPieChart({
  health,
  colors,
  animate,
}: {
  health: NonNullable<DashboardStats['connectionHealth']>;
  colors: string[];
  animate: boolean;
}) {
  const healthy = Math.max(0, (health.totalDevices ?? 0) - (health.devicesWithErrors ?? 0));
  const rows = [
    { name: 'Healthy', value: healthy },
    { name: 'Needs attention', value: health.devicesWithErrors ?? 0 },
  ].filter((row) => row.value > 0);

  if (rows.length === 0) return null;

  return (
    <Paper sx={premiumPanelCardSx}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        Device health mix
      </Typography>
      <Box sx={{ width: '100%', height: { xs: 200, sm: 220 }, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="52%"
              outerRadius="78%"
              paddingAngle={2}
              isAnimationActive={animate}
            >
              {rows.map((_, index) => (
                <Cell key={rows[index].name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number, name: string) => [value, name]} />
          </PieChart>
        </ResponsiveContainer>
      </Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, textAlign: 'center' }}>
        {health.averageSuccessRate?.toFixed(1) ?? 0}% avg. connection success
      </Typography>
    </Paper>
  );
}

export function AnalyticsBreakdownCharts({ stats }: AnalyticsBreakdownChartsProps) {
  const theme = useTheme();
  const reducedMotion = usePrefersReducedMotion();
  const animate = !reducedMotion;

  const usersByType = mapRows(stats.breakdowns?.usersByType ?? []);
  const cpByStatus = mapRows(stats.breakdowns?.chargePointsByStatus ?? []);
  const health = stats.connectionHealth;

  const hasAnyChart =
    usersByType.length > 0 || cpByStatus.length > 0 || (health?.totalDevices ?? 0) > 0;

  if (!hasAnyChart) return null;

  const pieColors = [theme.palette.success.main, theme.palette.warning.main];

  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      {usersByType.length > 0 && (
        <Grid item xs={12} md={6}>
          <BreakdownBarChart
            title="Users by account type"
            rows={usersByType}
            barColor={theme.palette.primary.main}
            animate={animate}
          />
        </Grid>
      )}
      {cpByStatus.length > 0 && (
        <Grid item xs={12} md={6}>
          <BreakdownBarChart
            title="Charge points by status"
            rows={cpByStatus}
            barColor={theme.palette.info.main}
            animate={animate}
          />
        </Grid>
      )}
      {health && (health.totalDevices ?? 0) > 0 && (
        <Grid item xs={12} md={6}>
          <DeviceHealthPieChart health={health} colors={pieColors} animate={animate} />
        </Grid>
      )}
    </Grid>
  );
}
