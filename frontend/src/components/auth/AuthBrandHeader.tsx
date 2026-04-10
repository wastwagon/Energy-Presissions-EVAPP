import { Box, Typography } from '@mui/material';
import { LOGO_PUBLIC_URL } from '../../config/branding';

type AuthBrandHeaderProps = {
  /** Shown under the logo; omit for a tighter header */
  tagline?: string;
  /** Match home/marketing left alignment; legal pages can keep centered via wrapper */
  align?: 'center' | 'left';
  /** Smaller logo and spacing for sign-in / register (mobile-first) */
  compact?: boolean;
};

/**
 * Logo for auth screens (image-only; no duplicate wordmark — see `public/logo.png`).
 */
export function AuthBrandHeader({ tagline, align = 'center', compact = false }: AuthBrandHeaderProps) {
  const isLeft = align === 'left';
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isLeft ? 'flex-start' : 'center',
        textAlign: isLeft ? 'left' : 'center',
        mb: compact ? { xs: 0.75, sm: 1 } : { xs: 1.25, sm: 1.5 },
      }}
    >
      <Box
        component="img"
        src={LOGO_PUBLIC_URL}
        alt=""
        role="presentation"
        loading="eager"
        decoding="async"
        sx={{
          height: compact
            ? { xs: 'clamp(44px, 12vw, 56px)', sm: 64 }
            : isLeft
              ? { xs: 'clamp(48px, 14vw, 64px)', sm: 72 }
              : { xs: 'clamp(72px, 22vw, 88px)', sm: 96 },
          width: 'auto',
          maxWidth: compact
            ? 'min(240px, 80vw)'
            : isLeft
              ? 'min(220px, 70vw)'
              : 'min(300px, 92vw)',
          objectFit: 'contain',
          display: 'block',
        }}
      />
      {tagline ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, maxWidth: 280 }}>
          {tagline}
        </Typography>
      ) : null}
    </Box>
  );
}
