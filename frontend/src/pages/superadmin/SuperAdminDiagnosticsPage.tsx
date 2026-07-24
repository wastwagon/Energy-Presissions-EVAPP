import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BugReportIcon from '@mui/icons-material/BugReport';
import EvStationIcon from '@mui/icons-material/EvStation';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { SUPERADMIN_ROUTES } from '../../config/staffNav.paths';

export function SuperAdminDiagnosticsPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Diagnostics"
        subtitle="Request diagnostics uploads from charge points"
        updatedAt={null}
        refreshing={false}
        onRefresh={() => undefined}
        showRefresh={false}
        showLiveMeta={false}
      />
      <AppEmptyState
        icon={<BugReportIcon />}
        title="Diagnostics are requested per device"
        description="Open Device Inventory, select a charge point, then use the Maintenance tab to request a diagnostics upload."
        primaryAction={{
          label: 'Open Device Inventory',
          onClick: () => navigate(SUPERADMIN_ROUTES.opsDevices),
          startIcon: <EvStationIcon />,
        }}
      />
    </Box>
  );
}
