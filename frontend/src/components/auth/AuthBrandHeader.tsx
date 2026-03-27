import { Box, Typography } from '@mui/material';

const LOGO_SRC = '/logo.jpeg';
const APP_NAME = 'Clean Motion Ghana';

type AuthBrandHeaderProps = {
  /** Shown under the logo; omit for a tighter header */
  tagline?: string;
};

/**
 * Centered logo + name for auth screens. Uses app favicon/logo from `public/logo.jpeg`.
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
        src={LOGO_SRC}
        alt=""
        role="presentation"
        loading="eager"
        decoding="async"
        sx={{
          height: { xs: 48, sm: 56 },
          width: 'auto',
          maxWidth: 'min(220px, 85vw)',
          objectFit: 'contain',
          display: 'block',
        }}
      />
      <Typography
        component="span"
        variant="subtitle2"
        sx={{
          mt: 1,
          fontWeight: 700,
          color: 'text.primary',
          letterSpacing: '0.02em',
          fontSize: { xs: '0.8125rem', sm: '0.875rem' },
        }}
      >
        {APP_NAME}
      </Typography>
      {tagline ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, maxWidth: 280 }}>
          {tagline}
        </Typography>
      ) : null}
    </Box>
  );
}
