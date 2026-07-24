import { Box, Typography, type SxProps, type Theme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { iosRadii } from '../../theme/iosMobileTokens';

export type CustomerHeroBannerProps = {
  src: string;
  alt: string;
  /** Optional overlay headline (keep short — brand/action, not a paragraph). */
  title?: string;
  subtitle?: string;
  /** Break out of typical customer page horizontal padding for edge-to-edge feel. */
  fullBleed?: boolean;
  /** Soft bottom fade into page background (default true). */
  fadeBottom?: boolean;
  sx?: SxProps<Theme>;
};

/**
 * Mobile-first photographic hero — full-bleed within the customer shell when `fullBleed`.
 * Prefer one short title + one supporting line; no badges or card chrome on the image.
 */
export function CustomerHeroBanner({
  src,
  alt,
  title,
  subtitle,
  fullBleed = true,
  fadeBottom = true,
  sx,
}: CustomerHeroBannerProps) {
  return (
    <Box
      sx={[
        {
          position: 'relative',
          overflow: 'hidden',
          borderRadius: fullBleed
            ? { xs: 0, sm: `${iosRadii.lg}px` }
            : `${iosRadii.lg}px`,
          mx: fullBleed ? { xs: -2, sm: 0 } : 0,
          mb: { xs: 2, sm: 2.5 },
          height: { xs: 168, sm: 200, md: 228 },
          bgcolor: 'primary.dark',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          background: (theme) =>
            `linear-gradient(180deg, ${alpha(theme.palette.common.black, 0.15)} 0%, ${alpha(
              theme.palette.primary.dark,
              0.55,
            )} 55%, ${alpha(theme.palette.primary.dark, fadeBottom ? 0.82 : 0.65)} 100%)`,
        }}
      />
      {(title || subtitle) && (
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            p: { xs: 2, sm: 2.5 },
            maxWidth: { sm: 480 },
          }}
        >
          {title ? (
            <Typography
              component="p"
              sx={{
                m: 0,
                color: 'common.white',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                fontSize: { xs: '1.35rem', sm: '1.5rem' },
                lineHeight: 1.2,
                textShadow: '0 1px 12px rgba(0,0,0,0.25)',
              }}
            >
              {title}
            </Typography>
          ) : null}
          {subtitle ? (
            <Typography
              variant="body2"
              sx={{
                mt: 0.75,
                color: alpha('#fff', 0.92),
                maxWidth: 360,
                lineHeight: 1.45,
                fontSize: { xs: '0.875rem', sm: '0.9375rem' },
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      )}
    </Box>
  );
}
