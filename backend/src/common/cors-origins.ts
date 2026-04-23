/**
 * Shared browser origins for HTTP CORS and Socket.IO.
 * Normalize (trim, no trailing slash) so env mistakes like "https://app/" still match.
 */
export function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

/** Comma-separated extra origins (both names supported — .env.example historically used CORS_ORIGIN). */
function extraOriginsFromEnv(): string[] {
  const a = process.env.CORS_ORIGINS?.split(',') ?? [];
  const b = process.env.CORS_ORIGIN?.split(',') ?? [];
  return [...a, ...b];
}

/**
 * HTTPS browser origins under this root host are allowed when not in strict mode
 * (exact list still checked first). Covers app + API misconfig and missing env on early module load.
 */
const TRUSTED_HTTPS_ROOT_DOMAINS = ['energyprecisions.com'] as const;

function isStrictCorsMode(): boolean {
  const v = (process.env.CORS_STRICT_ORIGINS || '').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function isTrustedHttpsBrandedHost(normalizedOrigin: string): boolean {
  if (isStrictCorsMode()) return false;
  if (!normalizedOrigin.startsWith('https://')) return false;
  let hostname: string;
  try {
    hostname = new URL(normalizedOrigin).hostname;
  } catch {
    return false;
  }
  for (const root of TRUSTED_HTTPS_ROOT_DOMAINS) {
    if (hostname === root || hostname.endsWith(`.${root}`)) {
      return true;
    }
  }
  return false;
}

export function collectAllowedOrigins(): string[] {
  const raw: (string | undefined)[] = [
    process.env.FRONTEND_URL,
    process.env.MOBILE_API_URL,
    'https://cleanmotion.energyprecisions.com',
    'https://www.cleanmotion.energyprecisions.com',
    'https://ev-billing-frontend.onrender.com',
    'https://ev-billing-frontend-ah8t.onrender.com',
    'http://localhost:3001',
    'http://localhost:5173',
  ];

  for (const s of extraOriginsFromEnv()) {
    raw.push(s);
  }

  const set = new Set<string>();
  for (const o of raw) {
    if (!o || !String(o).trim()) continue;
    set.add(normalizeOrigin(String(o)));
  }
  return Array.from(set);
}

export function isBrowserOriginAllowed(origin: string | undefined, allowed: string[]): boolean {
  if (!origin) return true;
  const n = normalizeOrigin(origin);
  if (allowed.includes(n)) return true;
  if (isTrustedHttpsBrandedHost(n)) return true;
  return false;
}
