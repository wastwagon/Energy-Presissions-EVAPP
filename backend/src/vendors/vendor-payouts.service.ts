import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor, VendorPayoutCycle, VendorPayoutMethod } from '../entities/vendor.entity';
import { VendorPayout } from '../entities/vendor-payout.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { Transaction } from '../entities/transaction.entity';
import { nextPayoutDate, payoutCycleLabel } from './payout-cycle.util';
import { normalizePhone } from '../common/phone.util';

const PROFILE_FIELDS = [
  'name',
  'businessName',
  'businessRegistrationNumber',
  'taxId',
  'contactEmail',
  'contactPhone',
  'address',
  'supportEmail',
  'supportPhone',
  'websiteUrl',
  'receiptHeaderText',
  'receiptFooterText',
  'logoUrl',
] as const;

const SUPERADMIN_FIELDS = ['slug', 'domain', 'payoutCycle', 'payoutHoldDays'] as const;

const PAYOUT_METHOD_FIELDS = [
  'payoutMethod',
  'payoutMomoNetwork',
  'payoutMomoPhone',
  'payoutBankName',
  'payoutAccountName',
  'payoutAccountNumber',
  'payoutBankBranch',
] as const;

export type VendorPayoutSummary = {
  payoutCycle: VendorPayoutCycle;
  payoutCycleLabel: string;
  payoutHoldDays: number;
  nextPayoutAt: string;
  currency: string;
  grossCompleted: number;
  paidToDate: number;
  inHold: number;
  /** Completed sales past the hold window (before subtracting recorded payouts). */
  matured: number;
  /** Next payout: matured minus paid-to-date. */
  eligible: number;
  payoutMethod: VendorPayoutMethod | null;
  payoutMethodReady: boolean;
  payoutDestinationLabel: string | null;
};

function maskAccount(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\s/g, '');
  if (digits.length <= 4) return '••••';
  return `•••• ${digits.slice(-4)}`;
}

function destinationLabel(vendor: Vendor): string | null {
  if (vendor.payoutMethod === 'mobile_money') {
    const net = vendor.payoutMomoNetwork ? vendor.payoutMomoNetwork.toUpperCase() : 'MoMo';
    const phone = vendor.payoutMomoPhone ? ` • ${vendor.payoutMomoPhone}` : '';
    return `${net}${phone}`;
  }
  if (vendor.payoutMethod === 'bank') {
    const bank = vendor.payoutBankName || 'Bank';
    const acct = maskAccount(vendor.payoutAccountNumber);
    return acct ? `${bank} ${acct}` : bank;
  }
  return null;
}

function methodReady(vendor: Vendor): boolean {
  if (vendor.payoutMethod === 'mobile_money') {
    return Boolean(vendor.payoutMomoNetwork && vendor.payoutMomoPhone);
  }
  if (vendor.payoutMethod === 'bank') {
    return Boolean(vendor.payoutBankName && vendor.payoutAccountName && vendor.payoutAccountNumber);
  }
  return false;
}

@Injectable()
export class VendorPayoutsService {
  constructor(
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    @InjectRepository(VendorPayout)
    private payoutRepository: Repository<VendorPayout>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  pickUpdatableFields(
    body: Record<string, unknown>,
    isSuperAdmin: boolean,
  ): Partial<Vendor> {
    const picked: Record<string, unknown> = {};
    const keys = isSuperAdmin
      ? [...PROFILE_FIELDS, ...SUPERADMIN_FIELDS, ...PAYOUT_METHOD_FIELDS]
      : [...PROFILE_FIELDS, ...PAYOUT_METHOD_FIELDS];
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        picked[key] = body[key];
      }
    }
    if (picked.payoutHoldDays != null) {
      const days = Number(picked.payoutHoldDays);
      if (!Number.isFinite(days) || days < 0 || days > 90) {
        throw new BadRequestException('Hold days must be between 0 and 90');
      }
      picked.payoutHoldDays = Math.round(days);
    }
    if (picked.payoutCycle != null) {
      const cycle = String(picked.payoutCycle);
      if (!['weekly', 'biweekly', 'monthly'].includes(cycle)) {
        throw new BadRequestException('Payout cycle must be weekly, biweekly, or monthly');
      }
    }
    if (picked.payoutMethod === 'mobile_money' && typeof picked.payoutMomoPhone === 'string') {
      const normalized = normalizePhone(picked.payoutMomoPhone);
      if (normalized.length < 12) {
        throw new BadRequestException('Enter a valid Ghana mobile money number');
      }
      picked.payoutMomoPhone = `+${normalized}`;
    }
    if (picked.payoutMethod === '' || picked.payoutMethod === undefined) {
      // leave as-is
    }
    return picked as Partial<Vendor>;
  }

  async getSummary(vendor: Vendor): Promise<VendorPayoutSummary> {
    const holdDays = vendor.payoutHoldDays ?? 7;
    const cycle = vendor.payoutCycle ?? 'monthly';
    const cutoff = new Date(Date.now() - holdDays * 24 * 60 * 60 * 1000);

    const billed = `t.status = 'Completed' AND CAST(t.total_cost AS DECIMAL) > 0`;
    const sessionAt = 'COALESCE(t.stop_time, t.start_time)';
    const totals = await this.transactionRepository
      .createQueryBuilder('t')
      .innerJoin(ChargePoint, 'cp', 'cp.charge_point_id = t.charge_point_id')
      .select(`COALESCE(SUM(CASE WHEN ${billed} THEN t.total_cost ELSE 0 END), 0)`, 'gross')
      .addSelect(
        `COALESCE(SUM(CASE WHEN ${billed} AND ${sessionAt} <= :cutoff THEN t.total_cost ELSE 0 END), 0)`,
        'matured',
      )
      .where('cp.vendor_id = :vendorId', { vendorId: vendor.id })
      .setParameter('cutoff', cutoff)
      .getRawOne<{ gross: string; matured: string }>();

    const paidRow = await this.payoutRepository
      .createQueryBuilder('p')
      .select(`COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0)`, 'paid')
      .where('p.vendor_id = :vendorId', { vendorId: vendor.id })
      .getRawOne<{ paid: string }>();

    const grossCompleted = Math.round((Number(totals?.gross) || 0) * 100) / 100;
    const matured = Math.round((Number(totals?.matured) || 0) * 100) / 100;
    const paidToDate = Math.round((Number(paidRow?.paid) || 0) * 100) / 100;
    const inHold = Math.max(0, Math.round((grossCompleted - matured) * 100) / 100);
    const eligible = Math.max(0, Math.round((matured - paidToDate) * 100) / 100);

    return {
      payoutCycle: cycle,
      payoutCycleLabel: payoutCycleLabel(cycle),
      payoutHoldDays: holdDays,
      nextPayoutAt: nextPayoutDate(cycle).toISOString(),
      currency: 'GHS',
      grossCompleted,
      paidToDate,
      inHold,
      matured,
      eligible,
      payoutMethod: vendor.payoutMethod ?? null,
      payoutMethodReady: methodReady(vendor),
      payoutDestinationLabel: destinationLabel(vendor),
    };
  }

  async listPayouts(vendorId: number): Promise<VendorPayout[]> {
    return this.payoutRepository.find({
      where: { vendorId },
      order: { paidAt: 'DESC' },
      take: 50,
    });
  }

  async recordPayout(
    vendor: Vendor,
    body: { amount?: number; reference?: string; notes?: string },
    byUserId: number,
  ): Promise<VendorPayout> {
    const summary = await this.getSummary(vendor);
    if (!summary.payoutMethodReady) {
      throw new BadRequestException('Vendor has not finished payout details (MoMo or bank).');
    }
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Enter a payout amount greater than zero');
    }
    if (amount - summary.eligible > 0.009) {
      throw new BadRequestException(
        `Amount exceeds matured next payout GHS ${summary.eligible.toFixed(2)} (sessions still in the ${summary.payoutHoldDays}-day hold are not payable yet)`,
      );
    }

    const payout = this.payoutRepository.create({
      vendorId: vendor.id,
      amount: Math.round(amount * 100) / 100,
      currency: 'GHS',
      status: 'paid',
      paidAt: new Date(),
      reference: body.reference?.trim() || null,
      notes: body.notes?.trim() || null,
      methodSnapshot: vendor.payoutMethod,
      destinationSnapshot: destinationLabel(vendor),
      byUserId,
    });
    return this.payoutRepository.save(payout);
  }
}
