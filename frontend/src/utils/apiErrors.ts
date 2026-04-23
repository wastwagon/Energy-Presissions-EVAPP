type ErrLike = {
  message?: string;
  code?: string;
  response?: { data?: { message?: string } };
};

/** True when the build points the client at a different origin than the page (typical CORS setup). */
function isCrossOriginApiFromEnv(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = import.meta.env.VITE_API_URL;
  if (!raw || !String(raw).trim()) return false;
  const u = String(raw).trim();
  if (u.startsWith('/')) return false;
  try {
    const apiOrigin = new URL(u, window.location.href).origin;
    return apiOrigin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * User-facing copy for API failures. Network errors in production with a cross-origin
 * VITE_API_URL are often CORS (browser blocks) or an unreachable API, not the user’s Wi‑Fi.
 */
export function formatApiOrNetworkError(err: unknown): string {
  const e = err as ErrLike;
  if (e.response?.data?.message && typeof e.response.data.message === 'string') {
    return e.response.data.message;
  }
  if (e.code === 'ERR_NETWORK' || e.message === 'Network Error') {
    if (import.meta.env.PROD && isCrossOriginApiFromEnv()) {
      return 'Cannot reach the API. The browser may be blocking requests to a different host (CORS), or the API is temporarily unavailable. Your host should allow this site in the API CORS settings, or use one domain for the app and API (for example /api through the same reverse proxy) so the app does not call a separate API origin.';
    }
    return 'Cannot reach the server. Check your connection, VPN, or try again shortly. If this persists, the API may be unavailable.';
  }
  return e.message || 'Request failed';
}
