import { parseOptionalPositiveInt, isPositiveInt } from './parse-id';

export type StaffActor = {
  accountType?: string;
  vendorId?: number;
};

/**
 * Vendor filter for staff APIs.
 * Admin is always locked to the vendor on the JWT — never trust X-Vendor-Id / query.
 * SuperAdmin may impersonate via a requested id. Everyone else: no vendor filter.
 */
export function resolveStaffVendorScope(
  user: StaffActor,
  requestedVendorId?: unknown,
): number | undefined {
  if (user.accountType === 'Admin') {
    return isPositiveInt(user.vendorId) ? user.vendorId : undefined;
  }
  if (user.accountType === 'SuperAdmin') {
    return parseOptionalPositiveInt(requestedVendorId);
  }
  return undefined;
}
