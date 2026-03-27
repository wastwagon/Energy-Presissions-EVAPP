/**
 * Normalize phone for storage and lookup (Ghana-friendly: handles 0XXXXXXXXX, 9 digits, 233XXXXXXXXX).
 * Returns digits-only international form where possible.
 */
export function normalizePhone(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let s = raw.trim().replace(/[\s\-().]/g, '');
  if (s.startsWith('+')) s = s.slice(1);
  const digits = s.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length === 10 && digits.startsWith('0')) {
    return '233' + digits.slice(1);
  }
  if (digits.length === 9 && !digits.startsWith('0')) {
    return '233' + digits;
  }
  if (digits.startsWith('233') && digits.length >= 12) {
    return digits;
  }
  return digits;
}
