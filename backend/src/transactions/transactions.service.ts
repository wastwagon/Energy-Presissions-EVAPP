import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { MeterSample } from '../entities/meter-sample.entity';
import { Connector } from '../entities/connector.entity';
import {
  WalletTransaction,
  WalletTransactionStatus,
  WalletTransactionType,
} from '../entities/wallet-transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(MeterSample)
    private meterSampleRepository: Repository<MeterSample>,
    @InjectRepository(Connector)
    private connectorRepository: Repository<Connector>,
    @InjectRepository(WalletTransaction)
    private walletTransactionRepository: Repository<WalletTransaction>,
  ) {}

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
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const queryBuilder = this.transactionRepository.createQueryBuilder('tx');

    if (chargePointId) {
      queryBuilder.where('tx.charge_point_id = :chargePointId', { chargePointId });
    }

    // Filter by vendorId via charge point relationship
    if (vendorId) {
      queryBuilder
        .innerJoin('charge_points', 'cp', 'cp.charge_point_id = tx.charge_point_id')
        .andWhere('cp.vendor_id = :vendorId', { vendorId });
    }

    if (userId) {
      queryBuilder.andWhere('tx.user_id = :userId', { userId });
    }

    queryBuilder.orderBy('tx.start_time', 'DESC').take(limit).skip(offset);

    const [transactions, total] = await queryBuilder.getManyAndCount();

    return { transactions, total };
  }

  async findOne(transactionId: number): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    return transaction;
  }

  async findActive(vendorId?: number, userId?: number): Promise<Transaction[]> {
    const queryBuilder = this.transactionRepository.createQueryBuilder('tx');

    queryBuilder.where('tx.status = :status', { status: 'Active' });

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

    const fromDb = await queryBuilder.getMany();

    if (userId != null) {
      const walletSynthetic = await this.syntheticActiveSessionsForWalletUser(userId, fromDb);
      return [...fromDb, ...walletSynthetic];
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

    return [...fromDb, ...synthetic];
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

