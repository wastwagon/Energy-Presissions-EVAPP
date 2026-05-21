import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { formatCurrency } from '../../utils/formatters';
import { isNoEnergyCompleted } from '../../utils/sessionDisplay';
import { GroupedListSection } from '../ios/GroupedListSection';
import { GroupedDetailRow } from '../ios/GroupedDetailRow';
import { RevenueTrendChart } from './RevenueTrendChart';

function downloadRevenueCsv(rows: { label: string; count: number; amount: number }[]) {
  const lines = ['Category,Sessions,Amount (GHS)', ...rows.map((r) => `"${r.label}",${r.count},${r.amount.toFixed(2)}`)];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `revenue-summary-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface RevenueReportPanelProps {
  vendorId?: number;
  loadStats?: () => Promise<DashboardStats>;
}

export function RevenueReportPanel({ vendorId, loadStats }: RevenueReportPanelProps) {
  const theme = useTheme();
  const useGrouped = useMediaQuery(theme.breakpoints.down('md'));
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    void load();
  }, [load]);

  const breakdown = useMemo(() => {
    const completed = sessions.filter((t) => t.status === 'Completed');
    const withRevenue = completed.filter((t) => Number(t.totalCost) > 0);
    const noEnergy = completed.filter((t) => isNoEnergyCompleted(t));
    const zeroCost = completed.filter((t) => !Number(t.totalCost));
    const active = sessions.filter((t) => t.status === 'Active');
    const revenueSum = withRevenue.reduce((s, t) => s + Number(t.totalCost || 0), 0);
    return { completed, withRevenue, noEnergy, zeroCost, active, revenueSum };
  }, [sessions]);

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

  const totalRevenue = stats?.overview?.totalRevenue ?? stats?.totalRevenue ?? breakdown.revenueSum;
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Revenue is summed from completed session costs. Wallet holds are not revenue until the session finalizes.
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon />}
          disabled={loading}
          onClick={() => downloadRevenueCsv(summaryRows)}
          sx={(th) => ({ ...sxObject(th, compactOutlinedCtaSx), alignSelf: { xs: 'stretch', sm: 'flex-start' } })}
        >
          Export summary
        </Button>
      </Box>

      {loading ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          Loading revenue…
        </Typography>
      ) : (
        <>
          <Grid container spacing={{ xs: 2, sm: 2 }} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Paper sx={premiumPanelCardSx}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total revenue (completed)
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {formatCurrency(totalRevenue)}
                </Typography>
              </Paper>
            </Grid>
            {pendingHolds > 0 && (
              <Grid item xs={12} sm={6}>
                <Paper sx={premiumPanelCardSx}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Pending wallet holds
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {formatCurrency(pendingHolds)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Not counted in revenue until sessions complete
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>

          <Box sx={{ mb: 2 }}>
            <RevenueTrendChart days={30} />
          </Box>

          {useGrouped ? (
            <GroupedListSection title="Breakdown (recent sample)">
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
