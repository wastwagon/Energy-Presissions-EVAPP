import { Box, Typography, Paper, Alert, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import BlockIcon from '@mui/icons-material/Block';
import { authPagePaperSx, authPageRootSx } from '../../styles/authShell';

export function DisabledPage() {
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
              bgcolor: alpha(theme.palette.error.main, 0.1),
              border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
            })}
          >
            <BlockIcon sx={{ fontSize: 36, color: 'error.main' }} />
          </Box>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            Account disabled
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.5 }}>
            Your vendor access has been turned off by an administrator.
          </Typography>
        </Box>

        <Alert severity="error" sx={{ mb: 2, borderRadius: 2, py: 0.5 }}>
          You cannot use the dashboard or connect charging equipment until access is restored.
        </Alert>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          What this means
        </Typography>
        <Box component="ul" sx={{ pl: 2.5, mb: 2, m: 0, '& li': { mb: 1 } }}>
          <li>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
              System access and new charging sessions are blocked.
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
              Stations may be unable to complete cloud-backed operations.
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
