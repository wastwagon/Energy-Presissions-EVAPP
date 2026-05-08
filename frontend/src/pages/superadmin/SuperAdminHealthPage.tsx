import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Alert,
  Chip,
  Typography,
} from '@mui/material';
import MemoryIcon from '@mui/icons-material/Memory';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { healthApi } from '../../services/healthApi';
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumPanelCardSx } from '../../theme/jampackShell';
import { OpsQuickActions } from '../../components/dashboard/OpsQuickActions';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { useLiveRefresh } from '../../hooks/useLiveRefresh';
import { LIVE_DATA_LABELS } from '../../constants/liveDataLabels';
import { DashboardStaffChromeSkeleton } from '../../components/dashboard/DashboardStaffChromeSkeleton';

export function SuperAdminHealthPage() {
  const [health, setHealth] = useState<{ status: string; timestamp: string } | null>(null);
  const { loading, refreshing, updatedAt, runWithRefresh } = useLiveRefresh();
  const [error, setError] = useState<string | null>(null);

  const loadHealth = useCallback(async (silent?: boolean) => {
    await runWithRefresh(async () => {
      try {
        setError(null);
        const data = await healthApi.getHealth();
        setHealth(data);
        return true;
      } catch (err: any) {
        setError(err.message || 'Failed to reach API');
        setHealth(null);
        return false;
      }
    }, silent);
  }, [runWithRefresh]);

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
        subtitle="Monitor API and service status"
        updatedAt={updatedAt}
        liveLabel={LIVE_DATA_LABELS.health}
        refreshing={refreshing}
        refreshDisabled={loading}
        onRefresh={() => void loadHealth(true)}
        titleSx={dashboardPageTitleSx}
        subtitleSx={dashboardPageSubtitleSx}
      />

      <OpsQuickActions />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={premiumPanelCardSx}>
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
    </Box>
  );
}
