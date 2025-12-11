import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmartChargingService } from './smart-charging.service';
import { SmartChargingController } from './smart-charging.controller';
import { ChargingProfile } from '../entities/charging-profile.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { Transaction } from '../entities/transaction.entity';
import { ChargePointsModule } from '../charge-points/charge-points.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChargingProfile, ChargePoint, Transaction]),
    ChargePointsModule,
  ],
  controllers: [SmartChargingController],
  providers: [SmartChargingService],
  exports: [SmartChargingService],
})
export class SmartChargingModule {}



