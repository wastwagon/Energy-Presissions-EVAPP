import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, SelectQueryBuilder } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { MeterSample } from '../entities/meter-sample.entity';
import { Connector } from '../entities/connector.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { User } from '../entities/user.entity';
import { BrandingAsset } from '../entities/branding-asset.entity';
import {
  WalletTransaction,
  WalletTransactionStatus,
  WalletTransactionType,
} from '../entities/wallet-transaction.entity';

const ENERGY_MEASURAND = 'Energy.Active.Import.Register';

export type ActiveTransactionView = Transaction & {
  recordPending?: boolean;
  /** Energy consumed so far from latest meter register (not persisted until stop). */
  liveEnergyKwh?: number | null;
  /** Estimated cost from kWh × tariff, capped at wallet hold (not final until stop). */
  liveCostSoFar?: number | null;
  customerName?: string | null;
  customerEmail?: string | null;
  locationName?: string | null;
  vendorName?: string | null;
  vendorLogoUrl?: string | null;
  vendorBusinessName?: string | null;
  vendorReceiptHeaderText?: string | null;
  vendorReceiptFooterText?: string | null;
  vendorAddress?: string | null;
  vendorSupportEmail?: string | null;
  vendorSupportPhone?: string | null;
};

export type TransactionApiView = ActiveTransactionView;

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  /** Columns safe for list/active queries (excludes wallet_reserved_amount). */
  private applyTransactionListSelect(
    qb: SelectQueryBuilder<Transaction>,
  ): SelectQueryBuilder<Transaction> {
    return qb.select([
      'tx.id',
      'tx.transactionId',
      'tx.chargePointId',
      'tx.connectorId',
      'tx.idTag',
      'tx.userId',
      'tx.meterStart',
      'tx.meterStop',
      'tx.startTime',
      'tx.stopTime',
      'tx.totalEnergyKwh',
      'tx.durationMinutes',
      'tx.totalCost',
      'tx.currency',
      'tx.status',
      'tx.reason',
      'tx.reservationId',
      'tx.createdAt',
      'tx.updatedAt',
    ]);
  }

  private logSchemaMismatch(context: string, err: unknown): void {
    const message = err instanceof Error ? err.message : String(err);
    if (/does not exist|column .* not found/i.test(message)) {
      this.logger.error(
        `${context}: database schema mismatch (${message}). Run database/init/26-production-schema-hotfix.sql on PostgreSQL.`,
      );
    }
  }

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(MeterSample)
    private meterSampleRepository: Repository<MeterSample>,
    @InjectRepository(Connector)
    private connectorRepository: Repository<Connector>,
    @InjectRepository(WalletTransaction)
    private walletTransactionRepository: Repository<WalletTransaction>,
    @InjectRepository(ChargePoint)
    private chargePointRepository: Repository<ChargePoint>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(BrandingAsset)
    private brandingAssetRepository: Repository<BrandingAsset>,
    private walletService: WalletService,
  ) {}

  private formatUserDisplay(user: User | null | undefined): {
    customerName: string | null;
    customerEmail: string | null;
  } {
    if (!user) return { customerName: null, customerEmail: null };
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return {
      customerName: name || user.email || null,
      customerEmail: user.email || null,
    };
  }

  private emptyChargePointMeta(chargePointId?: string | null): {
    locationName: string | null;
    vendorName: string | null;
    vendorLogoUrl: string | null;
    vendorBusinessName: string | null;
    vendorReceiptHeaderText: string | null;
    vendorReceiptFooterText: string | null;
    vendorAddress: string | null;
    vendorSupportEmail: string | null;
    vendorSupportPhone: string | null;
  } {
    return {
      locationName: chargePointId ?? null,
      vendorName: null,
      vendorLogoUrl: null,
      vendorBusinessName: null,
      vendorReceiptHeaderText: null,
      vendorReceiptFooterText: null,
      vendorAddress: null,
      vendorSupportEmail: null,
      vendorSupportPhone: null,
    };
  }

  private async resolveVendorLogoUrl(
    vendorId: number | null,
    logoUrl: string | null,
  ): Promise<string | null> {
    if (logoUrl?.trim()) {
      return logoUrl.trim();
    }
    if (vendorId == null) {
      return null;
    }
    try {
      const logoAsset = await this.brandingAssetRepository.findOne({
        where: { vendorId, assetType: 'logo', isActive: true },
        order: { createdAt: 'DESC' },
      });
      return logoAsset?.filePath?.trim() ?? null;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Branding logo lookup skipped for vendor ${vendorId}: ${message}`);
      return null;
    }
  }

  private async attachChargePointMeta(
    tx: Transaction,
  ): Promise<{
    locationName: string | null;
    vendorName: string | null;
    vendorLogoUrl: string | null;
    vendorBusinessName: string | null;
    vendorReceiptHeaderText: string | null;
    vendorReceiptFooterText: string | null;
    vendorAddress: string | null;
    vendorSupportEmail: string | null;
    vendorSupportPhone: string | null;
  }> {
    try {
      const cp = await this.chargePointRepository.findOne({
        where: { chargePointId: tx.chargePointId },
        relations: ['vendor'],
      });
      if (!cp) {
        return this.emptyChargePointMeta(tx.chargePointId);
      }

      const vendor = cp.vendor;
      const vendorId = vendor?.id ?? cp.vendorId ?? null;
      const vendorName = vendor?.name ?? cp.vendorName ?? null;
      const vendorLogoUrl = await this.resolveVendorLogoUrl(vendorId, vendor?.logoUrl ?? null);

      return {
        locationName: cp.locationAddress?.trim() || cp.chargePointId || null,
        vendorName,
        vendorLogoUrl,
        vendorBusinessName: vendor?.businessName?.trim() || vendorName,
        vendorReceiptHeaderText: vendor?.receiptHeaderText ?? null,
        vendorReceiptFooterText: vendor?.receiptFooterText ?? null,
        vendorAddress: vendor?.address?.trim() || null,
        vendorSupportEmail: vendor?.supportEmail ?? vendor?.contactEmail ?? null,
        vendorSupportPhone: vendor?.supportPhone ?? vendor?.contactPhone ?? null,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Charge point meta skipped for ${tx.chargePointId ?? 'unknown'}: ${message}`,
      );
      return this.emptyChargePointMeta(tx.chargePointId);
    }
  }

  /** Avoid serializing password hashes and ORM relation graphs in API responses. */
  private sanitizeUserForApi(user: User | null | undefined): Partial<User> | undefined {
    if (!user) return undefined;
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      accountType: user.accountType,
      vendorId: user.vendorId,
    };
  }

  private buildTransactionApiPayload(
    tx: Transaction & { user?: User; recordPending?: boolean },
    extras: Partial<TransactionApiView>,
  ): TransactionApiView {
    const { user, chargePoint: _cp, meterSamples: _ms, ...base } = tx as Transaction & {
      user?: User;
      chargePoint?: unknown;
      meterSamples?: unknown;
    };
    return {
      ...(base as Transaction),
      user: this.sanitizeUserForApi(user) as User | undefined,
      ...extras,
    } as TransactionApiView;
  }

  private async mapTransactionForApi(tx: Transaction & { user?: User }): Promise<TransactionApiView> {
    const { customerName, customerEmail } = this.formatUserDisplay(tx.user);
    const cpMeta = await this.attachChargePointMeta(tx);
    return this.buildTransactionApiPayload(tx, {
      customerName,
      customerEmail,
      ...cpMeta,
    });
  }

  private parseDecimal(value: unknown): number {
    if (value === undefined || value === null) return 0;
    const n = typeof value === 'number' ? value : parseFloat(String(value));
    return Number.isFinite(n) ? n : 0;
  }

  private async resolveWalletReservedAmount(tx: Transaction): Promise<number | null> {
    const onRow = this.parseDecimal(tx.walletReservedAmount);
    if (onRow > 0) return onRow;
    if (!tx.userId || tx.transactionId <= 0) return null;

    const linked = await this.walletTransactionRepository.findOne({
      where: {
        userId: tx.userId,
        transactionId: tx.transactionId,
        type: WalletTransactionType.RESERVATION,
        status: WalletTransactionStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });
    if (linked) return this.parseDecimal(linked.amount);

    const bySite = await this.walletTransactionRepository.find({
      where: {
        userId: tx.userId,
        type: WalletTransactionType.RESERVATION,
        status: WalletTransactionStatus.PENDING,
        transactionId: IsNull(),
      },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    for (const res of bySite) {
      const cpId = this.parseChargePointIdFromReservationDescription(res.description);
      if (cpId === tx.chargePointId) return this.parseDecimal(res.amount);
    }
    return null;
  }

  private async enrichActiveSession(
    tx: Transaction & { recordPending?: boolean; user?: User },
  ): Promise<ActiveTransactionView> {
    const walletReserved = await this.resolveWalletReservedAmount(tx);
    let liveEnergyKwh: number | null = null;
    let liveCostSoFar: number | null = null;

    if (!tx.recordPending && tx.transactionId > 0) {
      const latest = await this.meterSampleRepository.findOne({
        where: {
          transactionId: tx.transactionId,
          measurand: ENERGY_MEASURAND,
        },
        order: { timestamp: 'DESC' },
      });

      if (latest) {
        const meterStart = this.parseDecimal(tx.meterStart);
        const energyWh = Math.max(0, this.parseDecimal(latest.value) - meterStart);
        liveEnergyKwh = Math.round((energyWh / 1000) * 1000) / 1000;

        const chargePoint = await this.chargePointRepository.findOne({
          where: { chargePointId: tx.chargePointId },
        });
        const pricePerKwh = chargePoint?.pricePerKwh
          ? this.parseDecimal(chargePoint.pricePerKwh)
          : 0;
        if (pricePerKwh > 0 && liveEnergyKwh > 0) {
          let cost = liveEnergyKwh * pricePerKwh;
          if (walletReserved != null && walletReserved > 0) {
            cost = Math.min(cost, walletReserved);
          }
          liveCostSoFar = Math.round(cost * 100) / 100;
        }
      }
    }

    const userEntity =
      tx.user ?? (tx.userId ? await this.userRepository.findOne({ where: { id: tx.userId } }) : null);
    const { customerName, customerEmail } = this.formatUserDisplay(userEntity);
    const cpMeta = await this.attachChargePointMeta(tx);

    return this.buildTransactionApiPayload(tx, {
      walletReservedAmount: walletReserved ?? tx.walletReservedAmount ?? null,
      liveEnergyKwh,
      liveCostSoFar,
      customerName,
      customerEmail,
      ...cpMeta,
    });
  }

  private async enrichActiveSessions(
    rows: Array<Transaction & { recordPending?: boolean }>,
  ): Promise<ActiveTransactionView[]> {
    const out: ActiveTransactionView[] = [];
    for (const tx of rows) {
      try {
        out.push(await this.enrichActiveSession(tx));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Active session ${tx.transactionId} omitted from response: ${message}`,
        );
      }
    }
    return out;
  }

  /** Matches `reserve()` description from wallet-based remote start (`charge-points.service`). */
  private parseChargePointIdFromReservationDescription(description: string | undefined): string | null {
    if (!description || typeof description !== 'string') return null;
    const m = description.match(/Charging session at\s+(\S+)/);
    return m?.[1] ?? null;
  }

  /**
   * Wallet remote-start reserves balance before StartTransaction arrives; if CSMS missed creating
   * the DB row, we still expose a session by correlating pending reservation ↔ charging connector.
   */
  private async syntheticActiveSessionsForWalletUser(
    userId: number,
    existing: Transaction[],
  ): Promise<Array<Transaction & { recordPending?: boolean }>> {
    const maxAgeMs = 2 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - maxAgeMs);

    const reservations = await this.walletTransactionRepository.find({
      where: {
        userId,
        type: WalletTransactionType.RESERVATION,
        status: WalletTransactionStatus.PENDING,
        transactionId: IsNull(),
      },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const busyStatuses = ['Charging', 'Finishing'];
    const synthetic: Array<Transaction & { recordPending?: boolean }> = [];

    for (const res of reservations) {
      if (res.createdAt < cutoff) continue;

      const chargePointId = this.parseChargePointIdFromReservationDescription(res.description);
      if (!chargePointId) continue;

      const connectors = await this.connectorRepository.find({
        where: { chargePointId },
      });

      for (const conn of connectors) {
        if (!busyStatuses.includes(conn.status)) continue;

        const duplicate = existing.some(
          (t) =>
            t.chargePointId === conn.chargePointId &&
            t.connectorId === conn.connectorId &&
            t.status === 'Active',
        );
        if (duplicate) continue;

        const overlapsSynthetic = synthetic.some(
          (s) =>
            s.chargePointId === conn.chargePointId && s.connectorId === conn.connectorId,
        );
        if (overlapsSynthetic) continue;

        const now = new Date();
        const startTime = conn.lastStatusUpdate ?? now;
        const idTag = `USER_${userId}`;
        synthetic.push({
          id: -conn.id,
          transactionId: -conn.id,
          chargePointId: conn.chargePointId,
          connectorId: conn.connectorId,
          userId,
          idTag,
          meterStart: 0,
          startTime,
          status: 'Active',
          currency: 'GHS',
          createdAt: now,
          updatedAt: now,
          recordPending: true,
        } as Transaction & { recordPending: true });
      }
    }

    return synthetic;
  }

  async findAll(
    limit: number = 100,
    offset: number = 0,
    chargePointId?: string,
    vendorId?: number,
    userId?: number,
  ): Promise<{ transactions: TransactionApiView[]; total: number }> {
    const queryBuilder = this.applyTransactionListSelect(
      this.transactionRepository.createQueryBuilder('tx'),
    ).leftJoinAndSelect('tx.user', 'user');

    if (chargePointId) {
      queryBuilder.where('tx.charge_point_id = :chargePointId', { chargePointId });
    }

    if (vendorId) {
      queryBuilder
        .innerJoin('charge_points', 'cp', 'cp.charge_point_id = tx.charge_point_id')
        .andWhere('cp.vendor_id = :vendorId', { vendorId });
    }

    if (userId) {
      queryBuilder.andWhere('tx.user_id = :userId', { userId });
    }

    queryBuilder.orderBy('tx.start_time', 'DESC').take(limit).skip(offset);

    let rows: Transaction[];
    let total: number;
    try {
      [rows, total] = await queryBuilder.getManyAndCount();
    } catch (err: unknown) {
      this.logSchemaMismatch('findAll', err);
      throw err;
    }
    const mapped: TransactionApiView[] = [];
    for (const tx of rows) {
      try {
        if (tx.status === 'Active' && tx.transactionId > 0) {
          mapped.push(await this.enrichActiveSession(tx as Transaction & { user?: User }));
        } else {
          mapped.push(await this.mapTransactionForApi(tx as Transaction & { user?: User }));
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Transaction ${tx.transactionId} omitted from list response: ${message}`,
        );
      }
    }

    return { transactions: mapped, total };
  }

  async assertTransactionAccessByOcppId(
    ocppTransactionId: number,
    user: { id: number; accountType: string; vendorId?: number },
  ): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: { transactionId: ocppTransactionId },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction ${ocppTransactionId} not found`);
    }

    if (user.accountType === 'Customer' || user.accountType === 'WalkIn') {
      if (transaction.userId !== user.id) {
        throw new ForbiddenException('You cannot access this transaction');
      }
      return;
    }

    if (user.accountType === 'Admin' && user.vendorId) {
      const cp = await this.chargePointRepository.findOne({
        where: { chargePointId: transaction.chargePointId },
      });
      if (!cp || cp.vendorId !== user.vendorId) {
        throw new ForbiddenException('You cannot access this transaction');
      }
    }
  }

  async findOne(transactionId: number): Promise<TransactionApiView> {
    const transaction = await this.transactionRepository.findOne({
      where: { transactionId },
      relations: ['user'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    if (transaction.status === 'Active') {
      return this.enrichActiveSession(transaction as Transaction & { user?: User });
    }
    return this.mapTransactionForApi(transaction as Transaction & { user?: User });
  }

  async findActive(vendorId?: number, userId?: number): Promise<ActiveTransactionView[]> {
    try {
      const released = await this.walletService.releaseStalePendingReservations(48);
      if (released > 0) {
        this.logger.log(`Auto-released ${released} stale wallet hold(s)`);
      }
    } catch (err) {
      this.logger.warn(
        `Stale wallet hold cleanup skipped: ${err instanceof Error ? err.message : err}`,
      );
    }

    const queryBuilder = this.applyTransactionListSelect(
      this.transactionRepository.createQueryBuilder('tx'),
    )
      .leftJoinAndSelect('tx.user', 'user')
      .where('tx.status = :status', { status: 'Active' });

    // Filter by vendorId via charge point relationship
    if (vendorId) {
      queryBuilder
        .innerJoin('charge_points', 'cp', 'cp.charge_point_id = tx.charge_point_id')
        .andWhere('cp.vendor_id = :vendorId', { vendorId });
    }

    if (userId) {
      queryBuilder.andWhere('tx.user_id = :userId', { userId });
    }

    queryBuilder.orderBy('tx.start_time', 'DESC');

    let fromDb: Transaction[];
    try {
      fromDb = await queryBuilder.getMany();
    } catch (err: unknown) {
      this.logSchemaMismatch('findActive', err);
      throw err;
    }

    if (userId != null) {
      const walletSynthetic = await this.syntheticActiveSessionsForWalletUser(userId, fromDb);
      return this.enrichActiveSessions([...fromDb, ...walletSynthetic]);
    }

    // When OCPP reports Charging but CSMS missed StartTransaction (service token/network), show a placeholder row.
    const busyStatuses = ['Charging', 'Finishing'];
    const connQ = this.connectorRepository
      .createQueryBuilder('c')
      .innerJoin('charge_points', 'cp', 'cp.charge_point_id = c.charge_point_id')
      .where('c.status IN (:...busy)', { busy: busyStatuses });

    if (vendorId) {
      connQ.andWhere('cp.vendor_id = :vendorId', { vendorId });
    }

    const busyConnectors = await connQ.getMany();

    const synthetic: Transaction[] = [];
    for (const conn of busyConnectors) {
      const already = fromDb.some(
        (t) =>
          t.chargePointId === conn.chargePointId &&
          t.connectorId === conn.connectorId &&
          t.status === 'Active',
      );
      if (already) continue;

      const now = new Date();
      const startTime = conn.lastStatusUpdate ?? now;
      synthetic.push({
        id: -conn.id,
        transactionId: -conn.id,
        chargePointId: conn.chargePointId,
        connectorId: conn.connectorId,
        meterStart: 0,
        startTime,
        status: 'Active',
        currency: 'GHS',
        createdAt: now,
        updatedAt: now,
        recordPending: true,
      } as Transaction & { recordPending?: boolean });
    }

    return this.enrichActiveSessions([...fromDb, ...synthetic]);
  }

  async getMeterValues(transactionId: number): Promise<MeterSample[]> {
    await this.findOne(transactionId); // Verify transaction exists
    return this.meterSampleRepository.find({
      where: { transactionId },
      order: { timestamp: 'ASC' },
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    chargePointId?: string,
    vendorId?: number,
  ): Promise<Transaction[]> {
    const queryBuilder = this.transactionRepository.createQueryBuilder('tx');

    queryBuilder.where('tx.start_time BETWEEN :startDate AND :endDate', {
      startDate,
      endDate,
    });

    if (chargePointId) {
      queryBuilder.andWhere('tx.charge_point_id = :chargePointId', { chargePointId });
    }

    // Filter by vendorId via charge point relationship
    if (vendorId) {
      queryBuilder
        .innerJoin('charge_points', 'cp', 'cp.charge_point_id = tx.charge_point_id')
        .andWhere('cp.vendor_id = :vendorId', { vendorId });
    }

    queryBuilder.orderBy('tx.start_time', 'DESC');

    return queryBuilder.getMany();
  }
}

