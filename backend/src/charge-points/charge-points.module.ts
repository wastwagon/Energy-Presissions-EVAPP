import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ChargePointsService } from './charge-points.service';
import { ChargePointsController } from './charge-points.controller';
import { ChargePoint } from '../entities/charge-point.entity';
import { Connector } from '../entities/connector.entity';
import { Transaction } from '../entities/transaction.entity';
import { WalletModule } from '../wallet/wallet.module';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChargePoint, Connector, Transaction, User]),
    ConfigModule,
    WalletModule,
  ],
  controllers: [ChargePointsController],
  providers: [ChargePointsService],
  exports: [ChargePointsService],
})
export class ChargePointsModule {}

