import { nextPayoutDate } from './payout-cycle.util';

describe('nextPayoutDate', () => {
  it('returns today when it is the 1st for monthly', () => {
    expect(nextPayoutDate('monthly', new Date('2026-09-01T12:00:00Z')).toISOString()).toBe(
      '2026-09-01T00:00:00.000Z',
    );
  });

  it('returns the next 1st when monthly and not the 1st', () => {
    expect(nextPayoutDate('monthly', new Date('2026-08-17T12:00:00Z')).toISOString()).toBe(
      '2026-09-01T00:00:00.000Z',
    );
  });

  it('returns this Monday for weekly when today is Monday', () => {
    expect(nextPayoutDate('weekly', new Date('2026-08-17T12:00:00Z')).toISOString()).toBe(
      '2026-08-17T00:00:00.000Z',
    );
  });

  it('returns this Monday for biweekly on an even ISO week Monday', () => {
    expect(nextPayoutDate('biweekly', new Date('2026-08-17T12:00:00Z')).toISOString()).toBe(
      '2026-08-17T00:00:00.000Z',
    );
  });

  it('skips odd ISO weeks for biweekly', () => {
    expect(nextPayoutDate('biweekly', new Date('2026-08-19T12:00:00Z')).toISOString()).toBe(
      '2026-08-31T00:00:00.000Z',
    );
  });
});
