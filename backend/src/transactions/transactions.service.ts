import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { MeterSample } from '../entities/meter-sample.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(MeterSample)
    private meterSampleRepository: Repository<MeterSample>,
  ) {}

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

    return queryBuilder.getMany();
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

