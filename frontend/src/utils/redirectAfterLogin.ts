/**
 * Single place for post-auth navigation by role (unified login).
 */
export function redirectAfterLogin(accountType: string): void {
  if (accountType === 'SuperAdmin') {
    window.location.href = '/superadmin/dashboard';
    return;
  }
  if (accountType === 'Admin') {
    window.location.href = '/admin/dashboard';
    return;
  }
  window.location.href = '/user/dashboard';
}
