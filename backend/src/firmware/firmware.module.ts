import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FirmwareService } from './firmware.service';
import { FirmwareController } from './firmware.controller';
import { FirmwareJob } from '../entities/firmware-job.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { ChargePointsModule } from '../charge-points/charge-points.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { resolveJwtSecret } from '../common/utils/jwt-secret';

@Module({
  imports: [
    TypeOrmModule.forFeature([FirmwareJob, ChargePoint]),
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
  controllers: [FirmwareController],
  providers: [FirmwareService, JwtAuthGuard, RolesGuard],
  exports: [FirmwareService],
})
export class FirmwareModule {}
