import { brandColors } from '../theme';

export function getRoleAccentColor(accountType?: string): string {
  if (accountType === 'SuperAdmin') return brandColors.primaryDark;
  if (accountType === 'Admin') return brandColors.secondary;
  return brandColors.primary;
}
