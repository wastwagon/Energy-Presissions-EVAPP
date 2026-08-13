export function isStaffAccount(accountType?: string): boolean {
  return accountType === 'SuperAdmin' || accountType === 'Admin';
}
