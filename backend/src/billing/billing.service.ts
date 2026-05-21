import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { Tariff } from '../entities/tariff.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { Vendor } from '../entities/vendor.entity';
import { SystemSetting } from '../entities/system-setting.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import Decimal from 'decimal.js';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Tariff)
    private tariffRepository: Repository<Tariff>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    @InjectRepository(SystemSetting)
    private systemSettingRepository: Repository<SystemSetting>,
    @InjectRepository(ChargePoint)
    private chargePointRepository: Repository<ChargePoint>,
  ) {}

  /**
   * Calculate cost for a transaction based on tariff
   */
  async calculateCost(
    energyKwh: number,
    durationMinutes: number,
    transactionDate: Date,
    currency: string = 'GHS',
    vendorId?: number,
  ): Promise<{ totalCost: number; breakdown: any }> {
    const tariff = await this.getActiveTariff(transactionDate, currency, vendorId);

    if (!tariff) {
      throw new NotFoundException('No active tariff found');
    }

    const energy = new Decimal(energyKwh || 0);
    const duration = new Decimal(durationMinutes || 0);
    const hours = duration.dividedBy(60);

    // Calculate energy cost
    const energyRate = new Decimal(tariff.energyRate || 0);
    const energyCost = energy.times(energyRate);

    // Calculate time cost
    const timeRate = new Decimal(tariff.timeRate || 0);
    const timeCost = hours.times(timeRate);

    // Base fee
    const baseFee = new Decimal(tariff.baseFee || 0);

    // Total cost
    const totalCost = energyCost.plus(timeCost).plus(baseFee);

    return {
      totalCost: parseFloat(totalCost.toFixed(2)),
      breakdown: {
        energyKwh: parseFloat(energy.toFixed(3)),
        energyRate: parseFloat(energyRate.toFixed(4)),
        energyCost: parseFloat(energyCost.toFixed(2)),
        durationMinutes: parseFloat(duration.toFixed(0)),
        durationHours: parseFloat(hours.toFixed(2)),
        timeRate: parseFloat(timeRate.toFixed(4)),
        timeCost: parseFloat(timeCost.toFixed(2)),
        baseFee: parseFloat(baseFee.toFixed(2)),
        currency: tariff.currency,
      },
    };
  }

  /**
   * Get active tariff for a given date
   */
  async getActiveTariff(
    date: Date,
    currency: string = 'GHS',
    vendorId?: number,
  ): Promise<Tariff | null> {
    const qb = this.tariffRepository
      .createQueryBuilder('t')
      .where('t.is_active = true')
      .andWhere('t.currency = :currency', { currency });

    if (vendorId != null) {
      qb.andWhere('(t.vendor_id = :vendorId OR t.vendor_id IS NULL)', { vendorId });
      qb.orderBy('CASE WHEN t.vendor_id = :vendorId THEN 0 ELSE 1 END', 'ASC').addOrderBy(
        't.created_at',
        'DESC',
      );
    } else {
      qb.andWhere('t.vendor_id IS NULL').orderBy('t.created_at', 'DESC');
    }

    const tariffs = await qb.getMany();
    const validTariffs = tariffs.filter((tariff) => {
      const validFrom = tariff.validFrom ? new Date(tariff.validFrom) <= date : true;
      const validTo = tariff.validTo ? new Date(tariff.validTo) >= date : true;
      return validFrom && validTo;
    });

    return validTariffs.length > 0 ? validTariffs[0] : null;
  }

  private async resolveTransactionVendorId(transaction: Transaction): Promise<number | undefined> {
    const cpVendor = (transaction.chargePoint as ChargePoint | undefined)?.vendorId;
    if (cpVendor != null) return cpVendor;

    const chargePoint = await this.chargePointRepository.findOne({
      where: { chargePointId: transaction.chargePointId },
    });
    return chargePoint?.vendorId ?? undefined;
  }

  private async assertVendorAccessToTransaction(
    transactionId: number,
    vendorId: number,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { transactionId },
      relations: ['chargePoint'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    const txVendorId = await this.resolveTransactionVendorId(transaction);
    if (txVendorId !== vendorId) {
      throw new ForbiddenException('Transaction is outside your vendor scope');
    }

    return transaction;
  }

  /**
   * Calculate and update transaction cost
   */
  async calculateTransactionCost(
    transactionId: number,
    actingVendorId?: number,
  ): Promise<Transaction> {
    const transaction = actingVendorId
      ? await this.assertVendorAccessToTransaction(transactionId, actingVendorId)
      : await this.transactionRepository.findOne({
          where: { transactionId },
          relations: ['chargePoint'],
        });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    if (!transaction.stopTime || !transaction.totalEnergyKwh) {
      throw new Error('Transaction is not completed');
    }

    const vendorId = await this.resolveTransactionVendorId(transaction);
    const { totalCost } = await this.calculateCost(
      transaction.totalEnergyKwh,
      transaction.durationMinutes || 0,
      transaction.startTime,
      transaction.currency,
      vendorId,
    );

    transaction.totalCost = totalCost;
    await this.transactionRepository.save(transaction);

    return transaction;
  }

  /**
   * Generate invoice for a transaction
   * Note: Invoice generation will use vendor branding when generating PDFs
   * The vendor information is stored in the invoice metadata for receipt generation
   */
  async generateInvoice(transactionId: number, actingVendorId?: number): Promise<Invoice> {
    if (actingVendorId) {
      await this.assertVendorAccessToTransaction(transactionId, actingVendorId);
    }

    const transaction = await this.transactionRepository.findOne({
      where: { transactionId },
      relations: ['user', 'chargePoint', 'chargePoint.vendor'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    if (transaction.status !== 'Completed') {
      throw new Error('Can only generate invoice for completed transactions');
    }

    // Calculate cost if not already calculated
    if (!transaction.totalCost) {
      await this.calculateTransactionCost(transactionId, actingVendorId);
      // Reload transaction
      const reloaded = await this.transactionRepository.findOne({
        where: { transactionId },
        relations: ['chargePoint'],
      });
      if (reloaded) {
        transaction.totalCost = reloaded.totalCost;
      }
    }

    // Check if invoice already exists
    const existingInvoice = await this.invoiceRepository.findOne({
      where: { transactionId: transaction.transactionId },
    });

    if (existingInvoice) {
      return existingInvoice;
    }

    // Vendor for future PDF branding (not stored on invoice row yet)
    const _resolvedVendorIdForBranding =
      (transaction.chargePoint as any)?.vendorId ??
      (transaction.user as any)?.vendorId ??
      1;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${transaction.transactionId}`;

    const subtotal = new Decimal(transaction.totalCost || 0);
    const taxPercent = await this.resolveTaxPercent(
      (transaction.chargePoint as any)?.vendorId ?? (transaction.user as any)?.vendorId,
    );
    const tax = subtotal.times(taxPercent).dividedBy(100);
    const total = subtotal.plus(tax);

    const invoice = this.invoiceRepository.create({
      invoiceNumber,
      transactionId: transaction.transactionId,
      userId: transaction.userId,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      currency: transaction.currency,
      status: 'Generated',
    });

    // Note: Vendor branding (logo, business name, address, etc.) will be retrieved
    // when generating the PDF receipt using the vendorId
    // This is handled in the invoice generation service/controller

    return this.invoiceRepository.save(invoice);
  }

  async getInvoiceByTransactionId(
    transactionId: number,
    actingVendorId?: number,
  ): Promise<Invoice | null> {
    if (actingVendorId) {
      await this.assertVendorAccessToTransaction(transactionId, actingVendorId);
    }

    return this.invoiceRepository.findOne({
      where: { transactionId },
      relations: ['user'],
    });
  }

  /**
   * Get transactions for billing
   */
  async getTransactions(
    limit: number = 100,
    offset: number = 0,
    userId?: number,
    vendorId?: number,
    startDate?: Date,
    endDate?: Date,
  ) {
    const qb = this.transactionRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.chargePoint', 'cp')
      .orderBy('t.startTime', 'DESC')
      .take(limit)
      .skip(offset);

    if (userId) {
      qb.andWhere('t.user_id = :userId', { userId });
    }

    if (vendorId != null) {
      qb.andWhere('cp.vendor_id = :vendorId', { vendorId });
    }

    if (startDate && endDate) {
      qb.andWhere('t.start_time BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const [transactions, total] = await qb.getManyAndCount();
    return { transactions, total };
  }

  /**
   * Get invoices
   */
  async getInvoices(
    limit: number = 100,
    offset: number = 0,
    userId?: number,
    vendorId?: number,
  ) {
    const qb = this.invoiceRepository
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.user', 'user')
      .orderBy('inv.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    if (userId) {
      qb.andWhere('inv.user_id = :userId', { userId });
    }

    if (vendorId != null) {
      qb.innerJoin('transactions', 'tx', 'tx.transaction_id = inv.transaction_id');
      qb.innerJoin('charge_points', 'cp', 'cp.charge_point_id = tx.charge_point_id');
      qb.andWhere('cp.vendor_id = :vendorId', { vendorId });
    }

    const [invoices, total] = await qb.getManyAndCount();
    return { invoices, total };
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(id: number, actingVendorId?: number): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }

    if (actingVendorId && invoice.transactionId) {
      await this.assertVendorAccessToTransaction(invoice.transactionId, actingVendorId);
    }

    return invoice;
  }

  private parseTaxPercent(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return null;
    }

    return parsed;
  }

  private async resolveTaxPercent(vendorId?: number): Promise<number> {
    if (vendorId) {
      const vendor = await this.vendorRepository.findOne({ where: { id: vendorId } });
      const metadata = (vendor?.metadata || {}) as Record<string, unknown>;
      const vendorRate = this.parseTaxPercent(
        metadata.taxRatePercent ?? metadata.taxRate ?? metadata.vatRatePercent ?? metadata.vatRate,
      );
      if (vendorRate !== null) {
        return vendorRate;
      }
    }

    const keys = ['billing.taxRatePercent', 'billing.vatRatePercent', 'tax.ratePercent'];
    for (const key of keys) {
      const setting = await this.systemSettingRepository.findOne({ where: { key } });
      const rate = this.parseTaxPercent(setting?.value);
      if (rate !== null) {
        return rate;
      }
    }

    return 0;
  }
}

