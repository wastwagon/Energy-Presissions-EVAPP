import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { Transaction } from '../entities/transaction.entity';
import { Vendor } from '../entities/vendor.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { ConnectionStatistics } from '../entities/connection-statistics.entity';
import { Connector } from '../entities/connector.entity';
import {
  WalletTransaction,
  WalletTransactionStatus,
  WalletTransactionType,
} from '../entities/wallet-transaction.entity';
import { WalletService } from '../wallet/wallet.service';
import { ChargePointsService } from '../charge-points/charge-points.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ChargePoint)
    private chargePointRepository: Repository<ChargePoint>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(ConnectionStatistics)
    private connectionStatisticsRepository: Repository<ConnectionStatistics>,
    @InjectRepository(Connector)
    private connectorRepository: Repository<Connector>,
    @InjectRepository(WalletTransaction)
    private walletTransactionRepository: Repository<WalletTransaction>,
    private readonly walletService: WalletService,
    private readonly chargePointsService: ChargePointsService,
  ) {}

  async runOpsMaintenance(opts?: {
    releaseWalletHours?: number;
    sweepConnectorMinutes?: number;
  }): Promise<{
    walletHoldsReleased: number;
    sweep: {
      chargePointsProcessed: number;
      connectorsCleared: number;
      chargePointIds: string[];
      skippedActiveSession: string[];
    };
  }> {
    const releaseWalletHours = opts?.releaseWalletHours ?? 48;
    const sweepConnectorMinutes = opts?.sweepConnectorMinutes ?? 30;
    const walletHoldsReleased =
      await this.walletService.releaseStalePendingReservations(releaseWalletHours);
    const sweep = await this.chargePointsService.sweepStaleOperationalStates(
      sweepConnectorMinutes,
    );
    this.logger.log(
      `Ops maintenance: released ${walletHoldsReleased} wallet hold(s); cleared ${sweep.connectorsCleared} connector(s) on ${sweep.chargePointIds.length} device(s)`,
    );
    return { walletHoldsReleased, sweep };
  }

  private async sumPendingWalletReservations(vendorId?: number): Promise<number> {
    const q = this.walletTransactionRepository
      .createQueryBuilder('wt')
      .select('COALESCE(SUM(wt.amount), 0)', 'sum')
      .where('wt.type = :type', { type: WalletTransactionType.RESERVATION })
      .andWhere('wt.status = :status', { status: WalletTransactionStatus.PENDING });

    if (vendorId != null) {
      q.innerJoin('transactions', 'tx', 'tx.id = wt.transaction_id')
        .innerJoin('charge_points', 'cp', 'cp.charge_point_id = tx.charge_point_id')
        .andWhere('cp.vendor_id = :vendorId', { vendorId });
    }

    const row = await q.getRawOne<{ sum: string }>();
    const sum = typeof row?.sum === 'string' ? parseFloat(row.sum) : Number(row?.sum ?? 0);
    return Math.round((Number.isFinite(sum) ? sum : 0) * 100) / 100;
  }

  /** Averages from completed sessions with cost &gt; 0 (meaningful billing only). */
  private async computeSessionAverages(vendorId?: number): Promise<{
    averageSessionDuration: number | null;
    averageRevenuePerSession: number | null;
    billedSessionCount: number;
  }> {
    const qb = this.transactionRepository
      .createQueryBuilder('tx')
      .where('tx.status = :status', { status: 'Completed' });

    if (vendorId != null) {
      qb.innerJoin('charge_points', 'cp', 'cp.charge_point_id = tx.charge_point_id').andWhere(
        'cp.vendor_id = :vendorId',
        { vendorId },
      );
    }

    const rows = await qb.select(['tx.durationMinutes', 'tx.totalCost']).getMany();

    const billed = rows.filter((tx) => {
      const cost =
        typeof tx.totalCost === 'string' ? parseFloat(tx.totalCost) : Number(tx.totalCost ?? 0);
      return Number.isFinite(cost) && cost > 0;
    });

    if (billed.length === 0) {
      return {
        averageSessionDuration: null,
        averageRevenuePerSession: null,
        billedSessionCount: 0,
      };
    }

    const durationSum = billed.reduce((sum, tx) => sum + (Number(tx.durationMinutes) || 0), 0);
    const revenueSum = billed.reduce((sum, tx) => {
      const cost =
        typeof tx.totalCost === 'string' ? parseFloat(tx.totalCost) : Number(tx.totalCost ?? 0);
      return sum + (Number.isFinite(cost) ? cost : 0);
    }, 0);

    return {
      averageSessionDuration: Math.round(durationSum / billed.length),
      averageRevenuePerSession: Math.round((revenueSum / billed.length) * 100) / 100,
      billedSessionCount: billed.length,
    };
  }

  /** Distinct charge points that have either an Active CSMS transaction or OCPP connectors in session. */
  private async countOperationalActiveChargePoints(vendorId?: number): Promise<number> {
    const busyStatuses = ['Charging', 'Finishing'];

    const txQ = this.transactionRepository
      .createQueryBuilder('tx')
      .select('DISTINCT tx.chargePointId', 'cid')
      .where('tx.status = :status', { status: 'Active' });

    const connQ = this.connectorRepository
      .createQueryBuilder('c')
      .select('DISTINCT c.chargePointId', 'cid')
      .where('c.status IN (:...busy)', { busy: busyStatuses });

    if (vendorId != null) {
      txQ.innerJoin('charge_points', 'cp1', 'cp1.charge_point_id = tx.charge_point_id').andWhere(
        'cp1.vendor_id = :vendorId',
        { vendorId },
      );
      connQ
        .innerJoin('charge_points', 'cp2', 'cp2.charge_point_id = c.charge_point_id')
        .andWhere('cp2.vendor_id = :vendorId', { vendorId });
    }

    const txRows = await txQ.getRawMany();
    const connRows = await connQ.getRawMany();

    const ids = new Set<string>();
    for (const r of txRows) {
      if (r.cid) ids.add(String(r.cid));
    }
    for (const r of connRows) {
      if (r.cid) ids.add(String(r.cid));
    }
    return ids.size;
  }

  /**
   * Get dashboard statistics for Super Admin (all vendors)
   */
  async getSuperAdminStats() {
    const connectionStats = await this.safeGetConnectionStats();

    const [
      totalUsers,
      totalChargePoints,
      totalVendors,
      activeTransactions,
      totalTransactions,
      totalInvoices,
      totalPayments,
    ] = await Promise.all([
      this.userRepository.count(),
      this.chargePointRepository.count(),
      this.vendorRepository.count(),
      this.countOperationalActiveChargePoints(),
      this.transactionRepository.count(),
      this.invoiceRepository.count(),
      this.paymentRepository.count(),
    ]);

    // Calculate revenue from completed transactions
    const completedTransactions = await this.transactionRepository.find({
      where: { status: 'Completed' },
      select: ['totalCost', 'currency'],
    });

    const totalRevenue = completedTransactions.reduce((sum, tx) => {
      // Ensure totalCost is parsed as a number (TypeORM may return decimal as string)
      const cost = typeof tx.totalCost === 'string' ? parseFloat(tx.totalCost) : (tx.totalCost || 0);
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    // Calculate total payments
    const payments = await this.paymentRepository.find({
      select: ['amount', 'currency'],
    });

    const totalPaymentsAmount = payments.reduce((sum, p) => {
      // Ensure amount is parsed as a number (TypeORM may return decimal as string)
      const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : (p.amount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const pendingWalletReserved = await this.sumPendingWalletReservations();
    const sessionAverages = await this.computeSessionAverages();

    // Connection health
    const totalDevices = connectionStats.length;
    const devicesWithErrors = connectionStats.filter((s) => s.consecutiveFailures > 0).length;
    const totalAttempts = connectionStats.reduce((sum, s) => sum + s.totalAttempts, 0);
    const totalSuccesses = connectionStats.reduce((sum, s) => sum + s.successfulConnections, 0);
    const averageSuccessRate =
      totalAttempts > 0 ? (totalSuccesses / totalAttempts) * 100 : 0;

    // User breakdown
    const usersByType = await this.userRepository
      .createQueryBuilder('user')
      .select('user.accountType', 'accountType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.accountType')
      .getRawMany();

    // Charge point status breakdown
    const chargePointsByStatus = await this.chargePointRepository
      .createQueryBuilder('cp')
      .select('cp.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('cp.status')
      .getRawMany();

    return {
      overview: {
        totalUsers,
        totalChargePoints,
        totalVendors,
        activeSessions: activeTransactions,
        totalTransactions,
        totalInvoices,
        totalPayments,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalPaymentsAmount: Math.round(totalPaymentsAmount * 100) / 100,
        pendingWalletReserved,
        activeBillingSessions: activeTransactions,
        averageSessionDuration: sessionAverages.averageSessionDuration,
        averageRevenuePerSession: sessionAverages.averageRevenuePerSession,
        billedSessionCount: sessionAverages.billedSessionCount,
      },
      connectionHealth: {
        totalDevices,
        devicesWithErrors,
        averageSuccessRate: Math.round(averageSuccessRate * 100) / 100,
        totalAttempts,
        totalSuccesses,
      },
      breakdowns: {
        usersByType: usersByType.map((u) => ({
          type: u.accountType,
          count: parseInt(u.count),
        })),
        chargePointsByStatus: chargePointsByStatus.map((cp) => ({
          status: cp.status,
          count: parseInt(cp.count),
        })),
      },
    };
  }

  private async safeGetConnectionStats(): Promise<ConnectionStatistics[]> {
    try {
      return await this.connectionStatisticsRepository.find();
    } catch (error: any) {
      const message = String(error?.message ?? '');
      if (
        message.includes('relation "connection_statistics" does not exist') ||
        message.includes("relation 'connection_statistics' does not exist")
      ) {
        this.logger.warn(
          'connection_statistics table missing; returning empty connection health stats',
        );
        return [];
      }
      throw error;
    }
  }

  /**
   * Get dashboard statistics for Vendor Admin (vendor-scoped)
   */
  async getVendorAdminStats(vendorId: number) {
    const [
      totalUsers,
      totalChargePoints,
      activeTransactions,
      totalTransactions,
      totalInvoices,
      totalPayments,
    ] = await Promise.all([
      this.userRepository.count({ where: { vendorId } }),
      this.chargePointRepository.count({ where: { vendorId } }),
      this.countOperationalActiveChargePoints(vendorId),
      this.transactionRepository
        .createQueryBuilder('tx')
        .innerJoin('charge_points', 'cp', 'cp.charge_point_id = tx.charge_point_id')
        .where('cp.vendor_id = :vendorId', { vendorId })
        .getCount(),
      this.invoiceRepository
        .createQueryBuilder('inv')
        .innerJoin('transactions', 'tx', 'tx.id = inv.transaction_id')
        .innerJoin('charge_points', 'cp', 'cp.charge_point_id = tx.charge_point_id')
        .where('cp.vendor_id = :vendorId', { vendorId })
        .getCount(),
      this.paymentRepository
        .createQueryBuilder('p')
        .innerJoin('transactions', 'tx', 'tx.transaction_id = p.transaction_id')
        .innerJoin('charge_points', 'cp', 'cp.charge_point_id = tx.charge_point_id')
        .where('cp.vendor_id = :vendorId', { vendorId })
        .getCount(),
    ]);

    // Calculate revenue from completed transactions for this vendor
    const completedTransactions = await this.transactionRepository
      .createQueryBuilder('tx')
      .innerJoin('charge_points', 'cp', 'cp.charge_point_id = tx.charge_point_id')
      .where('cp.vendor_id = :vendorId', { vendorId })
      .andWhere('tx.status = :status', { status: 'Completed' })
      .select(['tx.totalCost', 'tx.currency'])
      .getMany();

    const totalRevenue = completedTransactions.reduce((sum, tx) => {
      // Ensure totalCost is parsed as a number (TypeORM may return decimal as string)
      const cost = typeof tx.totalCost === 'string' ? parseFloat(tx.totalCost) : (tx.totalCost || 0);
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    const pendingWalletReserved = await this.sumPendingWalletReservations(vendorId);
    const sessionAverages = await this.computeSessionAverages(vendorId);

    const usersByType = await this.userRepository
      .createQueryBuilder('user')
      .where('user.vendor_id = :vendorId', { vendorId })
      .select('user.accountType', 'accountType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.accountType')
      .getRawMany();

    // Charge point status breakdown for this vendor
    const chargePointsByStatus = await this.chargePointRepository
      .createQueryBuilder('cp')
      .where('cp.vendor_id = :vendorId', { vendorId })
      .select('cp.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('cp.status')
      .getRawMany();

    return {
      overview: {
        totalUsers,
        totalChargePoints,
        activeSessions: activeTransactions,
        totalTransactions,
        totalInvoices,
        totalPayments,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        pendingWalletReserved,
        activeBillingSessions: activeTransactions,
        averageSessionDuration: sessionAverages.averageSessionDuration,
        averageRevenuePerSession: sessionAverages.averageRevenuePerSession,
        billedSessionCount: sessionAverages.billedSessionCount,
      },
      breakdowns: {
        usersByType: usersByType.map((u) => ({
          type: u.accountType,
          count: parseInt(u.count, 10),
        })),
        chargePointsByStatus: chargePointsByStatus.map((cp) => ({
          status: cp.status,
          count: parseInt(cp.count),
        })),
      },
    };
  }

  /**
   * Daily completed-session revenue for charting (billed sessions only: cost &gt; 0).
   */
  async getRevenueTrend(
    vendorId?: number,
    days: number = 30,
  ): Promise<{ points: Array<{ date: string; revenue: number; sessions: number }> }> {
    const windowDays = Math.min(90, Math.max(7, days));
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (windowDays - 1));

    const qb = this.transactionRepository
      .createQueryBuilder('tx')
      .select('DATE(COALESCE(tx.stop_time, tx.start_time))', 'day')
      .addSelect('COALESCE(SUM(CAST(tx.total_cost AS DECIMAL)), 0)', 'revenue')
      .addSelect('COUNT(*)', 'sessions')
      .where('tx.status = :status', { status: 'Completed' })
      .andWhere('CAST(tx.total_cost AS DECIMAL) > 0')
      .andWhere('COALESCE(tx.stop_time, tx.start_time) >= :since', { since });

    if (vendorId != null) {
      qb.innerJoin('charge_points', 'cp', 'cp.charge_point_id = tx.charge_point_id').andWhere(
        'cp.vendor_id = :vendorId',
        { vendorId },
      );
    }

    const rows = await qb.groupBy('day').orderBy('day', 'ASC').getRawMany<{
      day: string | Date;
      revenue: string;
      sessions: string;
    }>();

    const byDate = new Map<string, { revenue: number; sessions: number }>();
    for (const row of rows) {
      const date =
        row.day instanceof Date
          ? row.day.toISOString().slice(0, 10)
          : String(row.day).slice(0, 10);
      byDate.set(date, {
        revenue: Math.round(parseFloat(row.revenue) * 100) / 100,
        sessions: parseInt(row.sessions, 10) || 0,
      });
    }

    const points: Array<{ date: string; revenue: number; sessions: number }> = [];
    for (let i = 0; i < windowDays; i++) {
      const d = new Date(since);
      d.setUTCDate(since.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      const entry = byDate.get(key);
      points.push({
        date: key,
        revenue: entry?.revenue ?? 0,
        sessions: entry?.sessions ?? 0,
      });
    }

    return { points };
  }
}

