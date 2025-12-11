import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ChargePointsService } from './charge-points.service';
import { ChargePointsController } from './charge-points.controller';
import { ChargePoint } from '../entities/charge-point.entity';
import { Connector } from '../entities/connector.entity';
import { Transaction } from '../entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChargePoint, Connector, Transaction]),
    ConfigModule,
  ],
  controllers: [ChargePointsController],
  providers: [ChargePointsService],
  exports: [ChargePointsService],
})
export class ChargePointsModule {}

