import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { Transaction } from '../entities/transaction.entity';
import { Vendor } from '../entities/vendor.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';
import { ConnectionStatistics } from '../entities/connection-statistics.entity';

@Injectable()
export class DashboardService {
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
  ) {}

  /**
   * Get dashboard statistics for Super Admin (all vendors)
   */
  async getSuperAdminStats() {
    const [
      totalUsers,
      totalChargePoints,
      totalVendors,
      activeTransactions,
      totalTransactions,
      totalInvoices,
      totalPayments,
      connectionStats,
    ] = await Promise.all([
      this.userRepository.count(),
      this.chargePointRepository.count(),
      this.vendorRepository.count(),
      this.transactionRepository.count({ where: { status: 'Active' } }),
      this.transactionRepository.count(),
      this.invoiceRepository.count(),
      this.paymentRepository.count(),
      this.connectionStatisticsRepository.find(),
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
      this.transactionRepository
        .createQueryBuilder('tx')
        .innerJoin('charge_points', 'cp', 'cp.charge_point_id = tx.charge_point_id')
        .where('cp.vendor_id = :vendorId', { vendorId })
        .andWhere('tx.status = :status', { status: 'Active' })
        .getCount(),
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
      },
      breakdowns: {
        chargePointsByStatus: chargePointsByStatus.map((cp) => ({
          status: cp.status,
          count: parseInt(cp.count),
        })),
      },
    };
  }
}

