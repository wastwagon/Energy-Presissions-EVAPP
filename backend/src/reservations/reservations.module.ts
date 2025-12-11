import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { Reservation } from '../entities/reservation.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { Connector } from '../entities/connector.entity';
import { IdTag } from '../entities/id-tag.entity';
import { ChargePointsModule } from '../charge-points/charge-points.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, ChargePoint, Connector, IdTag]),
    ChargePointsModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}



