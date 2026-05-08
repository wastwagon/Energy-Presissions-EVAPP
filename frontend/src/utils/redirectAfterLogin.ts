/**
 * Single place for post-auth navigation by role (unified login).
 */
import { getDashboardPathForAccountType } from './authSession';

interface RedirectAfterLoginOptions {
  fromPath?: string | null;
  returnToStationId?: string | null;
}

export function redirectAfterLogin(
  accountType: string,
  options: RedirectAfterLoginOptions = {},
): string {
  const { fromPath, returnToStationId } = options;

  if (returnToStationId) {
    return `/stations/${returnToStationId}`;
  }

  // `/` is the generic shell entry — send users to their role dashboard (stations for customers).
  if (
    fromPath &&
    fromPath !== '/' &&
    fromPath.startsWith('/') &&
    !fromPath.startsWith('/login')
  ) {
    return fromPath;
  }

  return getDashboardPathForAccountType(accountType);
}
