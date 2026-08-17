import { Box, Typography } from '@mui/material';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { iosFontStacks } from '../../theme/iosMobileTokens';

/**
 * Fixed strip under the status-bar cover when the device reports offline.
 * Does not change layout height — sits above the AppBar so the message stays visible.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: 'fixed',
        top: 'var(--app-sat, env(safe-area-inset-top, 0px))',
        left: 0,
        right: 0,
        zIndex: 1600,
        bgcolor: 'warning.dark',
        color: 'warning.contrastText',
        px: 2,
        py: 0.75,
        minHeight: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <Typography
        component="p"
        sx={{
          fontFamily: iosFontStacks.ui,
          fontSize: '0.8125rem',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          lineHeight: 1.3,
          m: 0,
          textAlign: 'center',
        }}
      >
        You&apos;re offline. Some actions won&apos;t work until you reconnect.
      </Typography>
    </Box>
  );
}
