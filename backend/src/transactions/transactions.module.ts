import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from '../entities/transaction.entity';
import { MeterSample } from '../entities/meter-sample.entity';
import { Connector } from '../entities/connector.entity';
import { WalletTransaction } from '../entities/wallet-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, MeterSample, Connector, WalletTransaction])],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}

