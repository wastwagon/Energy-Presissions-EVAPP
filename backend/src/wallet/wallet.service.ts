import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import Decimal from 'decimal.js';
import { User } from '../entities/user.entity';
import {
  WalletTransaction,
  WalletTransactionType,
  WalletTransactionStatus,
} from '../entities/wallet-transaction.entity';
import { Payment } from '../entities/payment.entity';
import { Invoice } from '../entities/invoice.entity';
import { Transaction } from '../entities/transaction.entity';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(WalletTransaction)
    private walletTransactionRepository: Repository<WalletTransaction>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private dataSource: DataSource,
  ) {}

  /**
   * Get user wallet balance
   */
  async getBalance(userId: number): Promise<{ balance: number; currency: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    return {
      balance: parseFloat(user.balance.toString()),
      currency: user.currency,
    };
  }

  /**
   * Top up wallet (Admin or via payment)
   */
  async topUp(
    userId: number,
    amount: number,
    adminId?: number,
    adminNote?: string,
    paymentId?: number,
  ): Promise<WalletTransaction> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      const balanceBefore = new Decimal(user.balance || 0);
      const amountDecimal = new Decimal(amount);
      const balanceAfter = balanceBefore.plus(amountDecimal);

      // Update user balance
      user.balance = parseFloat(balanceAfter.toFixed(2));
      await manager.save(user);

      // Create wallet transaction using repository
      const walletTransactionRepo = manager.getRepository(WalletTransaction);
      const walletTransaction = walletTransactionRepo.create({
        userId,
        type: WalletTransactionType.TOP_UP,
        amount: parseFloat(amountDecimal.toFixed(2)),
        currency: user.currency,
        status: WalletTransactionStatus.COMPLETED,
        balanceBefore: parseFloat(balanceBefore.toFixed(2)),
        balanceAfter: parseFloat(balanceAfter.toFixed(2)),
        description: adminNote || 'Wallet top-up',
        reference: `TOPUP-${Date.now()}-${userId}`,
        paymentId,
        adminId,
        adminNote,
      });

      return walletTransactionRepo.save(walletTransaction);
    });
  }

  /**
   * Deduct from wallet (for payment)
   */
  async deduct(
    userId: number,
    amount: number,
    description: string,
    paymentId?: number,
    transactionId?: number,
  ): Promise<WalletTransaction> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      const balanceBefore = new Decimal(user.balance || 0);
      const amountDecimal = new Decimal(amount);

      if (balanceBefore.lessThan(amountDecimal)) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      const balanceAfter = balanceBefore.minus(amountDecimal);

      // Update user balance
      user.balance = parseFloat(balanceAfter.toFixed(2));
      await manager.save(user);

      // Create wallet transaction using repository
      const walletTransactionRepo = manager.getRepository(WalletTransaction);
      const walletTransaction = walletTransactionRepo.create({
        userId,
        type: WalletTransactionType.PAYMENT,
        amount: parseFloat(amountDecimal.toFixed(2)),
        currency: user.currency,
        status: WalletTransactionStatus.COMPLETED,
        balanceBefore: parseFloat(balanceBefore.toFixed(2)),
        balanceAfter: parseFloat(balanceAfter.toFixed(2)),
        description,
        reference: `PAY-${Date.now()}-${userId}`,
        paymentId,
        transactionId,
      });

      return walletTransactionRepo.save(walletTransaction);
    });
  }

  /**
   * Refund to wallet
   */
  async refund(
    userId: number,
    amount: number,
    description: string,
    paymentId?: number,
    transactionId?: number,
  ): Promise<WalletTransaction> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      const balanceBefore = new Decimal(user.balance || 0);
      const amountDecimal = new Decimal(amount);
      const balanceAfter = balanceBefore.plus(amountDecimal);

      // Update user balance
      user.balance = parseFloat(balanceAfter.toFixed(2));
      await manager.save(user);

      // Create wallet transaction using repository
      const walletTransactionRepo = manager.getRepository(WalletTransaction);
      const walletTransaction = walletTransactionRepo.create({
        userId,
        type: WalletTransactionType.REFUND,
        amount: parseFloat(amountDecimal.toFixed(2)),
        currency: user.currency,
        status: WalletTransactionStatus.COMPLETED,
        balanceBefore: parseFloat(balanceBefore.toFixed(2)),
        balanceAfter: parseFloat(balanceAfter.toFixed(2)),
        description,
        reference: `REFUND-${Date.now()}-${userId}`,
        paymentId,
        transactionId,
      });

      return walletTransactionRepo.save(walletTransaction);
    });
  }

  /**
   * Admin adjustment (add or subtract)
   */
  async adjust(
    userId: number,
    amount: number,
    adminId: number,
    adminNote: string,
  ): Promise<WalletTransaction> {
    if (amount === 0) {
      throw new BadRequestException('Amount cannot be zero');
    }

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      const balanceBefore = new Decimal(user.balance || 0);
      const amountDecimal = new Decimal(amount);
      const balanceAfter = balanceBefore.plus(amountDecimal);

      // Allow negative balances (debt) for adjustments
      // No restriction on negative balance for admin adjustments

      // Update user balance
      user.balance = parseFloat(balanceAfter.toFixed(2));
      await manager.save(user);

      // Create wallet transaction using repository
      const walletTransactionRepo = manager.getRepository(WalletTransaction);
      const walletTransaction = walletTransactionRepo.create({
        userId,
        type: WalletTransactionType.ADJUSTMENT,
        amount: parseFloat(Math.abs(amountDecimal.toNumber()).toFixed(2)),
        currency: user.currency,
        status: WalletTransactionStatus.COMPLETED,
        balanceBefore: parseFloat(balanceBefore.toFixed(2)),
        balanceAfter: parseFloat(balanceAfter.toFixed(2)),
        description: adminNote,
        reference: `ADJ-${Date.now()}-${userId}`,
        adminId,
        adminNote,
      });

      return walletTransactionRepo.save(walletTransaction);
    });
  }

  /**
   * Get wallet transactions for user
   */
  async getTransactions(
    userId: number,
    limit: number = 50,
    offset: number = 0,
  ) {
    const [transactions, total] = await this.walletTransactionRepository.findAndCount({
      where: { userId },
      relations: ['payment', 'transaction'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { transactions, total };
  }

  /**
   * Get wallet transaction by ID
   */
  async getTransaction(id: number): Promise<WalletTransaction> {
    const transaction = await this.walletTransactionRepository.findOne({
      where: { id },
      relations: ['user', 'payment', 'transaction'],
    });

    if (!transaction) {
      throw new NotFoundException(`Wallet transaction ${id} not found`);
    }

    return transaction;
  }

  /**
   * Check if user has sufficient balance
   */
  async hasSufficientBalance(userId: number, amount: number): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return false;
    }

    const balance = new Decimal(user.balance || 0);
    const amountDecimal = new Decimal(amount);

    return balance.greaterThanOrEqualTo(amountDecimal);
  }

  /**
   * Reserve amount from wallet (hold for pending transaction)
   * This locks the amount but doesn't deduct it yet
   */
  async reserve(
    userId: number,
    amount: number,
    description: string,
    transactionId?: number,
  ): Promise<WalletTransaction> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      const balanceBefore = new Decimal(user.balance || 0);
      const amountDecimal = new Decimal(amount);

      if (balanceBefore.lessThan(amountDecimal)) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      // Reserve amount (deduct from available balance)
      const balanceAfter = balanceBefore.minus(amountDecimal);

      // Update user balance
      user.balance = parseFloat(balanceAfter.toFixed(2));
      await manager.save(user);

      // Create reservation wallet transaction using repository
      const walletTransactionRepo = manager.getRepository(WalletTransaction);
      const walletTransaction = walletTransactionRepo.create({
        userId,
        type: WalletTransactionType.RESERVATION,
        amount: parseFloat(amountDecimal.toFixed(2)),
        currency: user.currency,
        status: WalletTransactionStatus.PENDING, // Pending until transaction completes
        balanceBefore: parseFloat(balanceBefore.toFixed(2)),
        balanceAfter: parseFloat(balanceAfter.toFixed(2)),
        description,
        reference: `RESERVE-${Date.now()}-${userId}`,
        transactionId,
      });

      return walletTransactionRepo.save(walletTransaction);
    });
  }

  /**
   * Finalize reservation - convert to payment
   */
  async finalizeReservation(
    reservationId: number,
    actualAmount: number,
    description?: string,
  ): Promise<WalletTransaction> {
    const reservation = await this.walletTransactionRepository.findOne({
      where: { id: reservationId },
    });

    if (!reservation || reservation.type !== WalletTransactionType.RESERVATION) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.status !== WalletTransactionStatus.PENDING) {
      throw new BadRequestException('Reservation already finalized');
    }

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: reservation.userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const reservedAmount = new Decimal(reservation.amount);
      const actualAmountDecimal = new Decimal(actualAmount);
      const refundAmount = reservedAmount.minus(actualAmountDecimal);

      // Update reservation status to completed
      reservation.status = WalletTransactionStatus.COMPLETED;
      reservation.type = WalletTransactionType.PAYMENT;
      reservation.amount = parseFloat(actualAmountDecimal.toFixed(2));
      if (description) {
        reservation.description = description;
      }
      await manager.save(reservation);

      // If actual amount is less than reserved, refund the difference
      if (refundAmount.greaterThan(0)) {
        const balanceBefore = new Decimal(user.balance || 0);
        const balanceAfter = balanceBefore.plus(refundAmount);

        user.balance = parseFloat(balanceAfter.toFixed(2));
        await manager.save(user);

        // Create refund transaction for the difference using repository
        const walletTransactionRepo = manager.getRepository(WalletTransaction);
        const refundTransaction = walletTransactionRepo.create({
          userId: reservation.userId,
          type: WalletTransactionType.REFUND,
          amount: parseFloat(refundAmount.toFixed(2)),
          currency: user.currency,
          status: WalletTransactionStatus.COMPLETED,
          balanceBefore: parseFloat(balanceBefore.toFixed(2)),
          balanceAfter: parseFloat(balanceAfter.toFixed(2)),
          description: `Refund for unused reserved amount - Transaction ${reservation.transactionId}`,
          reference: `REFUND-${Date.now()}-${reservation.userId}`,
          transactionId: reservation.transactionId,
        });

        await walletTransactionRepo.save(refundTransaction);
      }

      return reservation;
    });
  }

  /**
   * Cancel reservation - refund the full reserved amount
   */
  async cancelReservation(reservationId: number, reason?: string): Promise<WalletTransaction> {
    const reservation = await this.walletTransactionRepository.findOne({
      where: { id: reservationId },
    });

    if (!reservation || reservation.type !== WalletTransactionType.RESERVATION) {
      throw new NotFoundException('Reservation not found');
    }

    if (reservation.status !== WalletTransactionStatus.PENDING) {
      throw new BadRequestException('Reservation already finalized');
    }

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: reservation.userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Refund the reserved amount
      const balanceBefore = new Decimal(user.balance || 0);
      const refundAmount = new Decimal(reservation.amount);
      const balanceAfter = balanceBefore.plus(refundAmount);

      user.balance = parseFloat(balanceAfter.toFixed(2));
      await manager.save(user);

      // Mark reservation as cancelled
      reservation.status = WalletTransactionStatus.CANCELLED;
      await manager.save(reservation);

      // Create refund transaction using repository
      const walletTransactionRepo = manager.getRepository(WalletTransaction);
      const refundTransaction = walletTransactionRepo.create({
        userId: reservation.userId,
        type: WalletTransactionType.REFUND,
        amount: parseFloat(refundAmount.toFixed(2)),
        currency: user.currency,
        status: WalletTransactionStatus.COMPLETED,
        balanceBefore: parseFloat(balanceBefore.toFixed(2)),
        balanceAfter: parseFloat(balanceAfter.toFixed(2)),
        description: reason || `Cancelled reservation - Transaction ${reservation.transactionId}`,
        reference: `CANCEL-${Date.now()}-${reservation.userId}`,
        transactionId: reservation.transactionId,
      });

      return walletTransactionRepo.save(refundTransaction);
    });
  }

  /**
   * Get available balance (excluding pending reservations)
   */
  async getAvailableBalance(userId: number): Promise<{ available: number; reserved: number; total: number; currency: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Get total reserved amount from pending reservations
    const reservations = await this.walletTransactionRepository.find({
      where: {
        userId,
        type: WalletTransactionType.RESERVATION,
        status: WalletTransactionStatus.PENDING,
      },
    });

    const totalReserved = reservations.reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0);
    const totalBalance = parseFloat(user.balance.toString());
    const availableBalance = totalBalance - totalReserved;

    return {
      available: Math.max(0, availableBalance),
      reserved: totalReserved,
      total: totalBalance,
      currency: user.currency,
    };
  }
}



