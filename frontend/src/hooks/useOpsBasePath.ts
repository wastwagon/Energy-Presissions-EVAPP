import { useLocation } from 'react-router-dom';

/**
 * Returns the ops base path based on current route context.
 * Use when linking between ops pages (dashboard, sessions, devices, etc.)
 * so links work correctly under /admin/ops/* or /superadmin/ops/*.
 */
export function useOpsBasePath(): string {
  const { pathname } = useLocation();
  if (pathname.startsWith('/superadmin/ops')) return '/superadmin/ops';
  if (pathname.startsWith('/admin/ops')) return '/admin/ops';
  return '/ops';
}
