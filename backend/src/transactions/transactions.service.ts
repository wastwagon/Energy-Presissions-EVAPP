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
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const where: any = {};
    if (chargePointId) {
      where.chargePointId = chargePointId;
    }

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where,
      order: { startTime: 'DESC' },
      take: limit,
      skip: offset,
    });

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

  async findActive(): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { status: 'Active' },
      order: { startTime: 'DESC' },
    });
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
  ): Promise<Transaction[]> {
    const where: any = {
      startTime: Between(startDate, endDate),
    };

    if (chargePointId) {
      where.chargePointId = chargePointId;
    }

    return this.transactionRepository.find({
      where,
      order: { startTime: 'DESC' },
    });
  }
}

