import {
  formatUserFacingError,
  type UserErrorContext,
} from './userFriendlyErrors';

type ErrLike = {
  message?: string;
  code?: string;
  response?: { data?: { message?: string | string[]; error?: string } };
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

function nestMessage(data: { message?: string | string[]; error?: string } | undefined): string | null {
  if (!data) return null;
  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }
  if (Array.isArray(data.message) && data.message.length > 0) {
    return data.message.join(', ').trim();
  }
  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error.trim();
  }
  return null;
}

/**
 * User-facing copy for API / network failures (maps known backend messages to plain language).
 */
export function formatApiOrNetworkError(
  err: unknown,
  context: UserErrorContext = 'general',
): string {
  const e = err as ErrLike;
  const fromBody = nestMessage(e.response?.data);
  if (fromBody) {
    return formatUserFacingError({ message: fromBody }, context).message;
  }
  if (e.code === 'ERR_NETWORK' || e.message === 'Network Error') {
    return formatUserFacingError(
      {
        message:
          import.meta.env.PROD && isCrossOriginApiFromEnv()
            ? 'Cannot reach the server. Check your internet connection and try again.'
            : 'Connection problem. Check your internet and try again.',
      },
      context,
    ).message;
  }
  return formatUserFacingError(err, context).message;
}

export type { UserErrorContext };
