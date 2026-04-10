import type { SxProps, Theme } from '@mui/material/styles';
import { Box, Link, Typography, type LinkProps } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { getPrivacyPolicyLink, getSupportLink, getTermsOfServiceLink } from '../../config/legal.config';

export function LegalDocLink({
  label,
  href,
  external,
  onInternalNavigate,
  variant = 'caption',
  sx,
}: {
  label: string;
  href: string;
  external: boolean;
  /** Called when navigating to an in-app legal route (e.g. to close a mobile drawer). */
  onInternalNavigate?: () => void;
  variant?: 'caption' | 'body2';
  sx?: LinkProps['sx'];
}) {
  const linkSx: LinkProps['sx'] = [
    { fontWeight: 600 },
    ...(Array.isArray(sx) ? sx : sx != null ? [sx] : []),
  ];
  if (external) {
    return (
      <Link href={href} target="_blank" rel="noopener noreferrer" variant={variant} sx={linkSx}>
        {label}
      </Link>
    );
  }
  return (
    <Link
      component={RouterLink}
      to={href}
      variant={variant}
      sx={linkSx}
      onClick={() => onInternalNavigate?.()}
    >
      {label}
    </Link>
  );
}

type LegalAuthNoticeProps = {
  /** When true, include Sign in with Apple–specific disclosure (recommended near the Apple button). */
  includeAppleDisclosure?: boolean;
};

/**
 * Privacy / terms links and disclosures for auth screens (Apple & platform best practice).
 */
export type LegalFooterLinksProps = {
  onInternalNavigate?: () => void;
  sx?: SxProps<Theme>;
};

/** Compact Privacy / Terms links for auth footers, drawer footers, and help screens. */
export function LegalFooterLinks({ onInternalNavigate, sx: containerSx }: LegalFooterLinksProps = {}) {
  const privacy = getPrivacyPolicyLink();
  const terms = getTermsOfServiceLink();
  const support = getSupportLink();
  return (
    <Box
      sx={[
        {
          mt: 1.5,
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
          gap: 1,
          flexWrap: 'wrap',
          alignItems: 'center',
        },
        ...(containerSx ? (Array.isArray(containerSx) ? containerSx : [containerSx]) : []),
      ]}
    >
      <LegalDocLink
        label="Privacy Policy"
        href={privacy.href}
        external={privacy.external}
        onInternalNavigate={onInternalNavigate}
      />
      <Typography variant="caption" color="text.secondary" component="span" aria-hidden>
        ·
      </Typography>
      <LegalDocLink
        label="Terms of Service"
        href={terms.href}
        external={terms.external}
        onInternalNavigate={onInternalNavigate}
      />
      <Typography variant="caption" color="text.secondary" component="span" aria-hidden>
        ·
      </Typography>
      <LegalDocLink
        label="Support"
        href={support.href}
        external={support.external}
        onInternalNavigate={onInternalNavigate}
      />
    </Box>
  );
}

export function LegalAuthNotice({ includeAppleDisclosure = false }: LegalAuthNoticeProps) {
  const privacy = getPrivacyPolicyLink();
  const terms = getTermsOfServiceLink();

  return (
    <Box sx={{ mt: 1.5, mb: 0.5 }}>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ lineHeight: 1.5, mb: includeAppleDisclosure ? 1 : 0 }}>
        By continuing with Google or Apple, you agree to our{' '}
        <LegalDocLink label="Terms of Service" href={terms.href} external={terms.external} /> and acknowledge our{' '}
        <LegalDocLink label="Privacy Policy" href={privacy.href} external={privacy.external} />.
      </Typography>
      {includeAppleDisclosure && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ lineHeight: 1.5 }}>
          Sign in with Apple is operated by Apple. We only receive the name and email you choose to share in Apple’s
          sign-in flow, to create and secure your account. Apple’s handling of your data is described in Apple’s privacy
          materials.
        </Typography>
      )}
    </Box>
  );
}
