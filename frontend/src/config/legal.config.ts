/**
 * Legal document URLs for App Store / Play / Sign in with Apple expectations.
 * Set VITE_PRIVACY_POLICY_URL / VITE_TERMS_OF_SERVICE_URL to full https URLs (e.g.
 * https://cleanmotion.energyprecisions.com/privacy); otherwise the app uses in-app /privacy and /terms.
 */
export type LegalLinkTarget = { href: string; external: boolean };

function parseEnvUrl(key: 'VITE_PRIVACY_POLICY_URL' | 'VITE_TERMS_OF_SERVICE_URL'): string | null {
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
