import { Box, Typography, Paper, Alert } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';

export function DisabledPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 600, width: '100%' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <BlockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Account Disabled
          </Typography>
        </Box>

        <Alert severity="error" sx={{ mb: 3 }}>
          Your account has been disabled. Access to the system is not available at this time.
        </Alert>

        <Typography variant="body1" paragraph>
          Your account is currently <strong>disabled</strong>. This means:
        </Typography>

        <Box component="ul" sx={{ pl: 3, mb: 3 }}>
          <li>
            <Typography variant="body2">
              All access to the system has been restricted
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              You cannot access your account or start charging sessions
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Your charging stations cannot connect to the system
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              All pending operations have been cancelled
            </Typography>
          </li>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          If you have questions about this action, please contact our support team immediately.
        </Typography>

        <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Support Contact:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Email: support@evcharging.com
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Phone: +233 XX XXX XXXX
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}



