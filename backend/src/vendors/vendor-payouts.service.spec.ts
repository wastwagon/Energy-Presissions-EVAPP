import { VendorPayoutsService } from './vendor-payouts.service';

describe('VendorPayoutsService.pickUpdatableFields', () => {
  const service = new VendorPayoutsService(null as never, null as never, null as never);

  it('lets a vendor admin set payout method but not cycle or hold', () => {
    const picked = service.pickUpdatableFields(
      {
        payoutMethod: 'bank',
        payoutBankName: 'GCB',
        payoutAccountName: 'Site Host',
        payoutAccountNumber: '1234567890',
        payoutCycle: 'weekly',
        payoutHoldDays: 3,
      },
      false,
    );
    expect(picked.payoutMethod).toBe('bank');
    expect(picked.payoutBankName).toBe('GCB');
    expect(picked.payoutCycle).toBeUndefined();
    expect(picked.payoutHoldDays).toBeUndefined();
  });

  it('lets Super Admin set cycle and hold days', () => {
    const picked = service.pickUpdatableFields(
      { payoutCycle: 'weekly', payoutHoldDays: 14, name: 'Host' },
      true,
    );
    expect(picked.payoutCycle).toBe('weekly');
    expect(picked.payoutHoldDays).toBe(14);
    expect(picked.name).toBe('Host');
  });

  it('rejects hold days outside 0–90', () => {
    expect(() => service.pickUpdatableFields({ payoutHoldDays: 120 }, true)).toThrow(
      'Hold days must be between 0 and 90',
    );
  });

  it('normalizes Ghana MoMo numbers', () => {
    const picked = service.pickUpdatableFields(
      { payoutMethod: 'mobile_money', payoutMomoPhone: '0244123456' },
      false,
    );
    expect(picked.payoutMomoPhone).toBe('+233244123456');
  });
});
