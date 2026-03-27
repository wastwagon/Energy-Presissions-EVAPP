import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BugReportIcon from '@mui/icons-material/BugReport';
import EvStationIcon from '@mui/icons-material/EvStation';

export function SuperAdminDiagnosticsPage() {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
        Diagnostics
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Request diagnostics from charge points
      </Typography>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <BugReportIcon color="action" sx={{ fontSize: 40 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" gutterBottom>
                Diagnostics are requested per charge point. Go to Device Management, select a charge point, and use the Diagnostics section to request a diagnostics upload.
              </Typography>
              <Button
                variant="contained"
                startIcon={<EvStationIcon />}
                onClick={() => navigate('/superadmin/ops/devices')}
                sx={{ mt: 2 }}
              >
                Open Device Management
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
