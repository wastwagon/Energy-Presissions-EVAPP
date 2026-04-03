import { Box, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { getPrivacyPolicyLink, getTermsOfServiceLink } from '../../config/legal.config';

export function LegalDocLink({
  label,
  href,
  external,
}: {
  label: string;
  href: string;
  external: boolean;
}) {
  if (external) {
    return (
      <Link href={href} target="_blank" rel="noopener noreferrer" variant="caption" sx={{ fontWeight: 600 }}>
        {label}
      </Link>
    );
  }
  return (
    <Link component={RouterLink} to={href} variant="caption" sx={{ fontWeight: 600 }}>
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
/** Compact Privacy / Terms links for auth footers (all sign-in methods). */
export function LegalFooterLinks() {
  const privacy = getPrivacyPolicyLink();
  const terms = getTermsOfServiceLink();
  return (
    <Box
      sx={{
        mt: 1.5,
        textAlign: 'center',
        display: 'flex',
        justifyContent: 'center',
        gap: 1,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <LegalDocLink label="Privacy Policy" href={privacy.href} external={privacy.external} />
      <Typography variant="caption" color="text.secondary" component="span" aria-hidden>
        ·
      </Typography>
      <LegalDocLink label="Terms of Service" href={terms.href} external={terms.external} />
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
