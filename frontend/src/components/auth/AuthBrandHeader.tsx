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
        mb: 2,
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
          height: { xs: 56, sm: 64 },
          width: 'auto',
          maxWidth: 'min(260px, 88vw)',
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
