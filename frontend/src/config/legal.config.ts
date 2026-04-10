/**
 * Legal document URLs for App Store / Play / Sign in with Apple expectations.
 * Set VITE_PRIVACY_POLICY_URL / VITE_TERMS_OF_SERVICE_URL / VITE_SUPPORT_URL to full https URLs (e.g.
 * https://your-domain.com/privacy); otherwise the app uses in-app /privacy, /terms, and /support.
 *
 * App Store Connect:
 * - Support URL → same origin as production + /support (or VITE_SUPPORT_URL).
 * - Privacy Policy URL (App Privacy) → + /privacy (or VITE_PRIVACY_POLICY_URL).
 * - Terms: link in description or your website; in-app route is /terms (or VITE_TERMS_OF_SERVICE_URL).
 */
export type LegalLinkTarget = { href: string; external: boolean };

function parseEnvUrl(
  key: 'VITE_PRIVACY_POLICY_URL' | 'VITE_TERMS_OF_SERVICE_URL' | 'VITE_SUPPORT_URL',
): string | null {
  const raw = import.meta.env[key]?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return null;
}

export function getPrivacyPolicyLink(): LegalLinkTarget {
  const external = parseEnvUrl('VITE_PRIVACY_POLICY_URL');
  if (external) return { href: external, external: true };
  return { href: '/privacy', external: false };
}

export function getTermsOfServiceLink(): LegalLinkTarget {
  const external = parseEnvUrl('VITE_TERMS_OF_SERVICE_URL');
  if (external) return { href: external, external: true };
  return { href: '/terms', external: false };
}

export function getSupportLink(): LegalLinkTarget {
  const external = parseEnvUrl('VITE_SUPPORT_URL');
  if (external) return { href: external, external: true };
  return { href: '/support', external: false };
}
