import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BugReportIcon from '@mui/icons-material/BugReport';
import EvStationIcon from '@mui/icons-material/EvStation';
import { dashboardPageTitleSx, dashboardPageSubtitleSx, premiumPanelCardSx } from '../../theme/jampackShell';
import { compactContainedCtaSx, sxObject } from '../../styles/authShell';

export function SuperAdminDiagnosticsPage() {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h6" component="h1" sx={dashboardPageTitleSx}>
        Diagnostics
      </Typography>
      <Typography variant="body2" sx={{ ...dashboardPageSubtitleSx, mb: 3 }}>
        Request diagnostics from charge points
      </Typography>
      <Paper sx={premiumPanelCardSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <BugReportIcon color="action" sx={{ fontSize: 40 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body1" gutterBottom>
              Diagnostics are requested per charge point. Go to Device Management, select a charge point, and use the Diagnostics section to request a diagnostics upload.
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
