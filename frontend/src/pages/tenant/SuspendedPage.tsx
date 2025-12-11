import { Box, Typography, Paper, Alert } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

export function SuspendedPage() {
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
          <WarningIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Account Suspended
          </Typography>
        </Box>

        <Alert severity="warning" sx={{ mb: 3 }}>
          Your account has been temporarily suspended. You have read-only access to your account.
        </Alert>

        <Typography variant="body1" paragraph>
          Your account is currently in <strong>suspended</strong> mode. This means:
        </Typography>

        <Box component="ul" sx={{ pl: 3, mb: 3 }}>
          <li>
            <Typography variant="body2">
              You can view your account information and transaction history
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              You cannot start new charging sessions
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              You cannot make payments or top up your wallet
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              Active charging sessions can be stopped for safety
            </Typography>
          </li>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          If you believe this is an error, please contact our support team for assistance.
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



