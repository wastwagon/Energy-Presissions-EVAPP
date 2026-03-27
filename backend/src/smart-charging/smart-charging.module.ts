import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SmartChargingService } from './smart-charging.service';
import { SmartChargingController } from './smart-charging.controller';
import { ChargingProfile } from '../entities/charging-profile.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { Transaction } from '../entities/transaction.entity';
import { ChargePointsModule } from '../charge-points/charge-points.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChargingProfile, ChargePoint, Transaction]),
    ChargePointsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SmartChargingController],
  providers: [SmartChargingService, JwtAuthGuard, RolesGuard],
  exports: [SmartChargingService],
})
export class SmartChargingModule {}



