import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { AuthBrandHeader } from './AuthBrandHeader';
import { AuthModeTabs, type AuthMode } from './AuthModeTabs';
import { iosRadii } from '../../theme/iosMobileTokens';
import { CUSTOMER_IMAGES } from '../../config/customerImagery';
import { LegalFooterLinks } from '../legal/LegalAuthNotice';

type AuthSplitLayoutProps = {
  title: string;
  subtitle?: string;
  mode?: AuthMode;
  /** Hide Sign up / Log in tabs (e.g. forgot password) */
  hideModeTabs?: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Untitled UI auth shell (light):
 * - Mobile: simple centered form on white
 * - md+: split layout — form left, atmosphere image right
 * Brand stays teal via theme; photography uses existing auth atmosphere asset.
 */
export function AuthSplitLayout({
  title,
  subtitle,
  mode,
  hideModeTabs = false,
  children,
  footer,
}: AuthSplitLayoutProps) {
  return (
    <Box
      sx={{
        width: '100%',
        flex: 1,
        alignSelf: 'stretch',
        minHeight: '100vh',
        display: 'flex',
        bgcolor: 'background.paper',
        '@supports (min-height: 100dvh)': { minHeight: '100dvh' },
      }}
    >
      {/* Form column */}
      <Box
        sx={{
          flex: { xs: '1 1 auto', md: '1 1 50%' },
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: { xs: 3, sm: 4, md: 5 },
          py: {
            xs: 'max(env(safe-area-inset-top), env(safe-area-inset-bottom), 24px)',
            sm: 4,
          },
          boxSizing: 'border-box',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 360,
            mx: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: { xs: 2.5, sm: 3 },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <AuthBrandHeader compact />
            <Box sx={{ textAlign: 'center', width: '100%' }}>
              <Typography
                component="h1"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  letterSpacing: '-0.02em',
                  lineHeight: 1.25,
                  color: 'text.primary',
                }}
              >
                {title}
              </Typography>
              {subtitle ? (
                <Typography
                  component="p"
                  sx={{
                    mt: 1,
                    fontSize: '0.9375rem',
                    lineHeight: 1.5,
                    color: 'text.secondary',
                  }}
                >
                  {subtitle}
                </Typography>
              ) : null}
            </Box>
            {!hideModeTabs && mode ? <AuthModeTabs value={mode} /> : null}
          </Box>

          <Box>{children}</Box>

          {footer ? <Box sx={{ textAlign: 'center' }}>{footer}</Box> : null}

          <LegalFooterLinks sx={{ justifyContent: 'center', textAlign: 'center' }} />
        </Box>
      </Box>

      {/* Desktop split image panel */}
      <Box
        aria-hidden
        sx={{
          display: { xs: 'none', md: 'block' },
          flex: '1 1 50%',
          minWidth: 0,
          position: 'relative',
          overflow: 'hidden',
          bgcolor: '#074854',
          borderTopLeftRadius: { md: `${iosRadii.lg}px` },
          borderBottomLeftRadius: { md: `${iosRadii.lg}px` },
          m: { md: 1.5 },
        }}
      >
        <Box
          component="img"
          src={CUSTOMER_IMAGES.authAtmosphere}
          alt=""
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(165deg, ${alpha('#074854', 0.35)} 0%, ${alpha('#0a6570', 0.55)} 55%, ${alpha('#074854', 0.72)} 100%)`,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            left: 32,
            right: 32,
            bottom: 40,
            color: 'common.white',
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em', mb: 0.75 }}>
            Charge with confidence
          </Typography>
          <Typography sx={{ opacity: 0.9, fontSize: '0.9375rem', lineHeight: 1.5, maxWidth: 360 }}>
            Find stations, start a session, and pay from your wallet — built for Energy Presissions.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
