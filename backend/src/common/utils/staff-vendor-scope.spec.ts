import { resolveStaffVendorScope } from './staff-vendor-scope';

describe('resolveStaffVendorScope', () => {
  it('locks Admin to JWT vendorId and ignores requested ids', () => {
    expect(resolveStaffVendorScope({ accountType: 'Admin', vendorId: 3 }, 99)).toBe(3);
    expect(resolveStaffVendorScope({ accountType: 'Admin', vendorId: 3 }, '99')).toBe(3);
  });

  it('returns undefined when Admin has no vendor', () => {
    expect(resolveStaffVendorScope({ accountType: 'Admin' }, 1)).toBeUndefined();
  });

  it('lets SuperAdmin impersonate via requested id', () => {
    expect(resolveStaffVendorScope({ accountType: 'SuperAdmin' }, '12')).toBe(12);
    expect(resolveStaffVendorScope({ accountType: 'SuperAdmin' })).toBeUndefined();
  });

  it('ignores requested ids for customers', () => {
    expect(resolveStaffVendorScope({ accountType: 'Customer', vendorId: 1 }, 2)).toBeUndefined();
  });
});
