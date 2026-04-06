import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EvStationIcon from '@mui/icons-material/EvStation';
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumPanelCardSx } from '../../theme/jampackShell';
import { compactContainedCtaSx, sxObject } from '../../styles/authShell';
import { useOpsBasePath } from '../../hooks/useOpsBasePath';
import { OpsQuickActions } from '../../components/dashboard/OpsQuickActions';

export function SuperAdminFirmwarePage() {
  const navigate = useNavigate();
  const opsBase = useOpsBasePath();

  return (
    <Box sx={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
        Firmware Management
      </Typography>
      <Typography variant="body2" sx={{ ...dashboardPageSubtitleSx, mb: 2 }}>
        Update firmware on charge points
      </Typography>
      <OpsQuickActions opsBase={opsBase} />
      <Paper sx={premiumPanelCardSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <CloudUploadIcon color="action" sx={{ fontSize: 40 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body1" gutterBottom>
              Firmware updates are managed per charge point. Go to Device Management, select a charge point, and use the Firmware Update section to start an update.
            </Typography>
            <Button
              variant="contained"
              disableElevation
              startIcon={<EvStationIcon />}
              onClick={() => navigate('/superadmin/ops/devices')}
              sx={(th) => ({
                ...sxObject(th, compactContainedCtaSx),
                mt: 2,
                width: { xs: '100%', sm: 'auto' },
              })}
            >
              Open Device Management
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
