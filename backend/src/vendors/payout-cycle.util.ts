export type PayoutCycle = 'weekly' | 'biweekly' | 'monthly';

function utcDayStart(from: Date): Date {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
}

function utcMondayOf(d: Date): Date {
  const day = d.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + offset);
  return monday;
}

function isoWeekUtc(d: Date): number {
  const thursday = new Date(d);
  thursday.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  return Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Next settlement date in UTC (Ghana has no DST). Today counts if it is a payout day. */
export function nextPayoutDate(cycle: PayoutCycle, from: Date = new Date()): Date {
  const today = utcDayStart(from);
  if (cycle === 'monthly') {
    if (today.getUTCDate() === 1) return today;
    return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));
  }

  const thisMonday = utcMondayOf(today);
  const mondayIsToday = thisMonday.getTime() === today.getTime();
  let candidate = mondayIsToday ? today : new Date(thisMonday);
  if (!mondayIsToday) {
    candidate.setUTCDate(thisMonday.getUTCDate() + 7);
  }

  if (cycle === 'weekly') return candidate;

  if (isoWeekUtc(candidate) % 2 === 0) return candidate;
  candidate = new Date(candidate);
  candidate.setUTCDate(candidate.getUTCDate() + 7);
  return candidate;
}

export function payoutCycleLabel(cycle: PayoutCycle): string {
  if (cycle === 'weekly') return 'Weekly (Mondays)';
  if (cycle === 'biweekly') return 'Every two weeks (Mondays)';
  return 'Monthly (1st)';
}
