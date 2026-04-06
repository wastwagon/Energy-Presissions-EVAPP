/**
 * Admin / superadmin path helpers shared by useOpsBasePath and OpsQuickActions.
 */
import { ADMIN_ROUTES, LEGACY_OPS_BASE, SUPERADMIN_ROUTES } from './staffNav.paths';

export function getOpsNavPaths(pathname: string) {
  const isSuper = pathname.startsWith('/superadmin');
  const isAdmin = pathname.startsWith('/admin');
  if (isSuper) {
    return {
      opsBase: SUPERADMIN_ROUTES.ops,
      mainDashboard: SUPERADMIN_ROUTES.dashboard,
      wallets: SUPERADMIN_ROUTES.wallets,
      users: SUPERADMIN_ROUTES.users,
    };
  }
  if (isAdmin) {
    return {
      opsBase: ADMIN_ROUTES.ops,
      mainDashboard: ADMIN_ROUTES.dashboard,
      wallets: ADMIN_ROUTES.wallets,
      users: ADMIN_ROUTES.users,
    };
  }
  return {
    opsBase: LEGACY_OPS_BASE,
    mainDashboard: ADMIN_ROUTES.dashboard,
    wallets: ADMIN_ROUTES.wallets,
    users: ADMIN_ROUTES.users,
  };
}
