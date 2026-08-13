import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { Reservation } from '../entities/reservation.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { Connector } from '../entities/connector.entity';
import { IdTag } from '../entities/id-tag.entity';
import { ChargePointsModule } from '../charge-points/charge-points.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { resolveJwtSecret } from '../common/utils/jwt-secret';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, ChargePoint, Connector, IdTag]),
    ChargePointsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: resolveJwtSecret(config),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService, JwtAuthGuard, RolesGuard],
  exports: [ReservationsService],
})
export class ReservationsModule {}
