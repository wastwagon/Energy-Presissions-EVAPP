import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StationsController } from './stations.controller';
import { StationsService } from './stations.service';
import { ChargePoint } from '../entities/charge-point.entity';
import { Connector } from '../entities/connector.entity';
import { Transaction } from '../entities/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChargePoint, Connector, Transaction])],
  controllers: [StationsController],
  providers: [StationsService],
  exports: [StationsService],
})
export class StationsModule {}

