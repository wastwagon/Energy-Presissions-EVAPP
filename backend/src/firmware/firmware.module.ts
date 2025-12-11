import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirmwareService } from './firmware.service';
import { FirmwareController } from './firmware.controller';
import { FirmwareJob } from '../entities/firmware-job.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { ChargePointsModule } from '../charge-points/charge-points.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FirmwareJob, ChargePoint]),
    ChargePointsModule,
  ],
  controllers: [FirmwareController],
  providers: [FirmwareService],
  exports: [FirmwareService],
})
export class FirmwareModule {}



