/**
 * Shared browser origins for HTTP CORS and Socket.IO.
 * Normalize (trim, no trailing slash) so env mistakes like "https://app/" still match.
 */
export function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
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

  const extra = process.env.CORS_ORIGINS?.split(',') ?? [];
  for (const s of extra) {
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
  return allowed.includes(normalizeOrigin(origin));
}
