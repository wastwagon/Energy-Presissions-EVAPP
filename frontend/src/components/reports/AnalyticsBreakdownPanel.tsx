import { Box, Grid, Paper, Typography, useMediaQuery, useTheme } from '@mui/material';
import type { DashboardStats } from '../../services/dashboardApi';
import { premiumPanelCardSx } from '../../theme/jampackShell';
import { formatCurrency } from '../../utils/formatters';
import { GroupedListSection } from '../ios/GroupedListSection';
import { GroupedDetailRow } from '../ios/GroupedDetailRow';
import { AppBadge } from '../ui/AppBadge';
import { StaffMetricCard } from '../dashboard/StaffMetricCard';
import { AnalyticsBreakdownCharts } from './AnalyticsBreakdownCharts';

interface AnalyticsBreakdownPanelProps {
  stats: DashboardStats;
}

export function AnalyticsBreakdownPanel({ stats }: AnalyticsBreakdownPanelProps) {
  const theme = useTheme();
  const useGrouped = useMediaQuery(theme.breakpoints.down('md'));
  const overview = stats.overview;
  const usersByType = stats.breakdowns?.usersByType ?? [];
  const cpByStatus = stats.breakdowns?.chargePointsByStatus ?? [];
  const health = stats.connectionHealth;
  const pendingHolds = overview?.pendingWalletReserved ?? 0;

  const healthRows = health
    ? [
        { label: 'Devices monitored', value: String(health.totalDevices ?? 0) },
        { label: 'Devices with errors', value: String(health.devicesWithErrors ?? 0) },
        {
          label: 'Avg. connection success',
          value: `${health.averageSuccessRate?.toFixed(1) ?? 0}%`,
        },
      ]
    : [];

  if (useGrouped) {
    return (
      <Box sx={{ mt: 2 }}>
        {pendingHolds > 0 && (
          <GroupedListSection title="Billing">
            <GroupedDetailRow
              label="Pending wallet holds"
              value={
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.dark' }}>
                  {formatCurrency(pendingHolds)}
                </Typography>
              }
            />
          </GroupedListSection>
        )}
        {usersByType.length > 0 && (
          <GroupedListSection title="Users by type">
            {usersByType.map((row, i) => (
              <GroupedDetailRow
                key={row.type}
                label={row.type}
                value={String(row.count)}
                divider={i < usersByType.length - 1}
              />
            ))}
          </GroupedListSection>
        )}
        {cpByStatus.length > 0 && (
          <GroupedListSection title="Charge points by status">
            {cpByStatus.map((row, i) => (
              <GroupedDetailRow
                key={row.status}
                label={row.status}
                value={String(row.count)}
                divider={i < cpByStatus.length - 1}
              />
            ))}
          </GroupedListSection>
        )}
        {healthRows.length > 0 && (
          <GroupedListSection title="Connection health">
            {healthRows.map((row, i) => (
              <GroupedDetailRow
                key={row.label}
                label={row.label}
                value={row.value}
                divider={i < healthRows.length - 1}
              />
            ))}
          </GroupedListSection>
        )}
        <AnalyticsBreakdownCharts stats={stats} />
      </Box>
    );
  }

  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      {pendingHolds > 0 && (
        <Grid item xs={12} sm={6}>
          <StaffMetricCard
            label="Pending wallet holds"
            value={formatCurrency(pendingHolds)}
            hint="Not included in revenue until sessions complete"
            tone="warning"
          />
        </Grid>
      )}
      <Grid item xs={12} md={6}>
        <Paper sx={premiumPanelCardSx}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
            Users by account type
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {usersByType.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No breakdown available
              </Typography>
            ) : (
              usersByType.map((row) => (
                <AppBadge key={row.type} label={`${row.type}: ${row.count}`} tone="neutral" size="small" />
              ))
            )}
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={premiumPanelCardSx}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
            Charge points by status
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {cpByStatus.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No breakdown available
              </Typography>
            ) : (
              cpByStatus.map((row) => (
                <AppBadge
                  key={row.status}
                  label={`${row.status}: ${row.count}`}
                  tone="neutral"
                  size="small"
                />
              ))
            )}
          </Box>
        </Paper>
      </Grid>
      {health && (
        <Grid item xs={12}>
          <Paper sx={premiumPanelCardSx}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
              OCPP connection health
            </Typography>
            <Grid container spacing={2}>
              {healthRows.map((row) => (
                <Grid item xs={12} sm={4} key={row.label}>
                  <Typography variant="caption" color="text.secondary">
                    {row.label}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {row.value}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      )}
      <Grid item xs={12}>
        <AnalyticsBreakdownCharts stats={stats} />
      </Grid>
    </Grid>
  );
}
