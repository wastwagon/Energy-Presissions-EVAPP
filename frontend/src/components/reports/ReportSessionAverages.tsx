import { Grid, Paper, Typography } from '@mui/material';
import type { DashboardStats } from '../../services/dashboardApi';
import { premiumPanelCardSx } from '../../theme/jampackShell';
import { formatCurrency } from '../../utils/formatters';

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
          <Paper sx={premiumPanelCardSx}>
            <Typography variant="subtitle2" color="text.secondary">
              Average session duration
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {Math.round(duration)} min
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Completed billed sessions only
            </Typography>
          </Paper>
        </Grid>
      )}
      {revenue != null && (
        <Grid item xs={12} md={6}>
          <Paper sx={premiumPanelCardSx}>
            <Typography variant="subtitle2" color="text.secondary">
              Average revenue per session
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {formatCurrency(revenue)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Completed billed sessions only
            </Typography>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
}
