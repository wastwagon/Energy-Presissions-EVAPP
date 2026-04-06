import { Box, Typography, Paper, Alert, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import { authPagePaperSx, authPageRootSx } from '../../styles/authShell';

export function SuspendedPage() {
  return (
    <Box sx={authPageRootSx}>
      <Paper
        elevation={0}
        sx={{
          ...authPagePaperSx,
          maxWidth: 520,
          width: '100%',
          textAlign: 'left',
          p: { xs: 2.5, sm: 3.5 },
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 2.5 }}>
          <Box
            sx={(theme) => ({
              width: 72,
              height: 72,
              mx: 'auto',
              mb: 2,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.warning.main, 0.12),
              border: `1px solid ${alpha(theme.palette.warning.main, 0.35)}`,
            })}
          >
            <PauseCircleOutlineIcon sx={{ fontSize: 38, color: 'warning.dark' }} />
          </Box>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            Account suspended
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.5 }}>
            Temporary restriction — some actions are limited until your account is reviewed.
          </Typography>
        </Box>

        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2, py: 0.5 }}>
          You may have read-only access; new sessions, payments, or top-ups can be blocked.
        </Alert>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Typical restrictions
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, mb: 2, m: 0, '& li': { mb: 1 } }}>
          <li>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
              Viewing history may still be allowed; starting new charges may not.
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
              Wallet top-ups or payouts may be paused for compliance review.
            </Typography>
          </li>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.06em' }}>
          SUPPORT
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.55 }}>
          Email: support@evcharging.com
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
          Phone: +233 XX XXX XXXX
        </Typography>
      </Paper>
    </Box>
  );
}
