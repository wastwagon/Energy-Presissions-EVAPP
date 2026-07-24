import { Grid, Typography } from '@mui/material';
import type { DashboardStats } from '../../services/dashboardApi';
import { formatCurrency } from '../../utils/formatters';
import { StaffMetricCard } from '../dashboard/StaffMetricCard';

interface ReportSessionAveragesProps {
  stats: DashboardStats;
}

/** Shown when backend has at least one completed billed session. */
export function ReportSessionAverages({ stats }: ReportSessionAveragesProps) {
  const duration = stats.overview?.averageSessionDuration ?? stats.averageSessionDuration;
  const revenue = stats.overview?.averageRevenuePerSession ?? stats.averageRevenuePerSession;
  const billedCount = stats.overview?.billedSessionCount;

  if (duration == null && revenue == null) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Session averages appear after at least one completed session with billing (cost above GH₵0).
        {typeof billedCount === 'number' && billedCount === 0 ? ' None recorded yet for this scope.' : ''}
      </Typography>
    );
  }

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {duration != null && (
        <Grid item xs={12} md={6}>
          <StaffMetricCard
            label="Average session duration"
            value={`${Math.round(duration)} min`}
            hint="Completed billed sessions only"
          />
        </Grid>
      )}
      {revenue != null && (
        <Grid item xs={12} md={6}>
          <StaffMetricCard
            label="Average revenue per session"
            value={formatCurrency(revenue)}
            hint="Completed billed sessions only"
            tone="brand"
          />
        </Grid>
      )}
    </Grid>
  );
}
