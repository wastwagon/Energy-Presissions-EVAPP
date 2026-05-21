import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from '../entities/transaction.entity';
import { MeterSample } from '../entities/meter-sample.entity';
import { Connector } from '../entities/connector.entity';
import { WalletTransaction } from '../entities/wallet-transaction.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { User } from '../entities/user.entity';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, MeterSample, Connector, WalletTransaction, ChargePoint, User]),
    WalletModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}

