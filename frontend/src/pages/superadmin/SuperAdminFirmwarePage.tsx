import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EvStationIcon from '@mui/icons-material/EvStation';
import { LivePageHeader } from '../../components/dashboard/LivePageHeader';
import { AppEmptyState } from '../../components/ui/AppEmptyState';
import { SUPERADMIN_ROUTES } from '../../config/staffNav.paths';

export function SuperAdminFirmwarePage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <LivePageHeader
        title="Firmware Management"
        subtitle="Update firmware on charge points from each device’s Maintenance tab"
        updatedAt={null}
        refreshing={false}
        onRefresh={() => undefined}
        showRefresh={false}
        showLiveMeta={false}
      />
      <AppEmptyState
        icon={<CloudUploadIcon />}
        title="Firmware is managed per device"
        description="Open Device Inventory, select a charge point, then use the Maintenance tab to start a firmware update."
        primaryAction={{
          label: 'Open Device Inventory',
          onClick: () => navigate(SUPERADMIN_ROUTES.opsDevices),
          startIcon: <EvStationIcon />,
        }}
      />
    </Box>
  );
}
