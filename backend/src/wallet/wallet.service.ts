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

      // Create wallet transaction
      const walletTransaction = manager.create(WalletTransaction, {
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

      return manager.save(walletTransaction);
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

      // Create wallet transaction
      const walletTransaction = manager.create(WalletTransaction, {
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

      return manager.save(walletTransaction);
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

      // Create wallet transaction
      const walletTransaction = manager.create(WalletTransaction, {
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

      return manager.save(walletTransaction);
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

      if (balanceAfter.lessThan(0)) {
        throw new BadRequestException('Adjustment would result in negative balance');
      }

      // Update user balance
      user.balance = parseFloat(balanceAfter.toFixed(2));
      await manager.save(user);

      // Create wallet transaction
      const walletTransaction = manager.create(WalletTransaction, {
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

      return manager.save(walletTransaction);
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
}



