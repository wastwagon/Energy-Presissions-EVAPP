import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EvStationIcon from '@mui/icons-material/EvStation';

export function SuperAdminFirmwarePage() {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
        Firmware Management
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Update firmware on charge points
      </Typography>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <CloudUploadIcon color="action" sx={{ fontSize: 40 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" gutterBottom>
                Firmware updates are managed per charge point. Go to Device Management, select a charge point, and use the Firmware Update section to start an update.
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
