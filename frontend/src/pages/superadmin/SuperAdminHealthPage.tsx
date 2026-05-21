import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Alert,
  Chip,
  Typography,
  Button,
} from '@mui/material';
import MemoryIcon from '@mui/icons-material/Memory';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import BuildIcon from '@mui/icons-material/Build';
import { healthApi } from '../../services/healthApi';
import { maintenanceApi, type OpsMaintenanceResult } from '../../services/maintenanceApi';
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumPanelCardSx } from '../../theme/jampackShell';
import { compactOutlinedCtaSx, sxObject } from '../../styles/authShell';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { DashboardStaffChromeSkeleton } from '../../components/dashboard/DashboardStaffChromeSkeleton';

export function SuperAdminHealthPage() {
  const [health, setHealth] = useState<{ status: string; timestamp: string } | null>(null);
  const { loading, refreshing, updatedAt, runWithRefresh } = useLiveRefresh();
  const [error, setError] = useState<string | null>(null);
  const [maintenanceResult, setMaintenanceResult] = useState<OpsMaintenanceResult | null>(null);
  const [maintenanceRunning, setMaintenanceRunning] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);

  const loadHealth = useCallback(async (silent?: boolean) => {
    await runWithRefresh(async () => {
      try {
        setError(null);
        const data = await healthApi.getHealth();
        setHealth(data);
        return true;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to reach API');
        setHealth(null);
        return false;
      }
    }, silent);
  }, [runWithRefresh]);

  const runMaintenance = async () => {
    setMaintenanceError(null);
    setMaintenanceRunning(true);
    try {
      const result = await maintenanceApi.runOpsMaintenance({
        releaseWalletHours: 48,
        sweepConnectorMinutes: 30,
      });
      setMaintenanceResult(result);
    } catch (err: unknown) {
      setMaintenanceError(err instanceof Error ? err.message : 'Maintenance failed');
    } finally {
      setMaintenanceRunning(false);
    }
  };

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  if (loading) {
    return <DashboardStaffChromeSkeleton preset="systemHealth" />;
  }

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="System Health"
        subtitle="Monitor API status and run network maintenance"
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.health}
        refreshing={refreshing}
        refreshDisabled={loading}
        onRefresh={() => void loadHealth(true)}
        titleSx={dashboardPageTitleSx}
        subtitleSx={dashboardPageSubtitleSx}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ ...premiumPanelCardSx, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <MemoryIcon color="action" />
          <Typography variant="h6">API Status</Typography>
          {health ? (
            <Chip icon={<CheckCircleIcon />} label="Healthy" color="success" size="small" />
          ) : (
            <Chip icon={<ErrorIcon />} label="Unreachable" color="error" size="small" />
          )}
        </Box>
        {health && (
          <Typography variant="body2" color="text.secondary">
            Last check: {new Date(health.timestamp).toLocaleString()}
          </Typography>
        )}
      </Paper>

      <Paper sx={premiumPanelCardSx}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
          <BuildIcon color="action" sx={{ mt: 0.25 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Ops maintenance
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Releases wallet holds older than 48 hours with no active session, and clears connector
              charge-point state stuck in Preparing/Charging/Finishing for 30+ minutes when there is no
              active billing session.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          disabled={maintenanceRunning}
          onClick={() => void runMaintenance()}
          sx={(th) => ({
            ...sxObject(th, compactOutlinedCtaSx),
            width: { xs: '100%', sm: 'auto' },
          })}
        >
          {maintenanceRunning ? 'Running…' : 'Run maintenance now'}
        </Button>
        {maintenanceError && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setMaintenanceError(null)}>
            {maintenanceError}
          </Alert>
        )}
        {maintenanceResult && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Released {maintenanceResult.walletHoldsReleased} stale wallet hold(s). Cleared{' '}
            {maintenanceResult.sweep.connectorsCleared} connector(s) on{' '}
            {maintenanceResult.sweep.chargePointIds.length} device(s).
            {maintenanceResult.sweep.skippedActiveSession.length > 0
              ? ` Skipped ${maintenanceResult.sweep.skippedActiveSession.length} device(s) with active sessions.`
              : ''}
          </Alert>
        )}
      </Paper>
    </Box>
  );
}
