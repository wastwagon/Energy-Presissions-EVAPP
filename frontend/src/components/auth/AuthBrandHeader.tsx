import { Box, Typography } from '@mui/material';
import { LOGO_PUBLIC_URL } from '../../config/branding';

type AuthBrandHeaderProps = {
  /** Shown under the logo; omit for a tighter header */
  tagline?: string;
};

/**
 * Centered logo for auth screens (image-only; no duplicate wordmark — see `public/logo.png`).
 */
export function AuthBrandHeader({ tagline }: AuthBrandHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        mb: { xs: 1.25, sm: 1.5 },
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
          height: { xs: 'clamp(72px, 22vw, 88px)', sm: 96 },
          width: 'auto',
          maxWidth: 'min(300px, 92vw)',
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
