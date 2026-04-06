import { useLocation } from 'react-router-dom';
import { getOpsNavPaths } from '../config/opsNav.paths';

/**
 * Returns the ops base path based on current route context.
 * Use when linking between ops pages (dashboard, sessions, devices, etc.)
 * so links work correctly under /admin/ops/* or /superadmin/ops/*.
 *
 * Also resolves from any /admin/* or /superadmin/* path (e.g. main dashboard,
 * wallets, users) so shortcuts work outside the ops subtree.
 */
export function useOpsBasePath(): string {
  const { pathname } = useLocation();
  return getOpsNavPaths(pathname).opsBase;
}
