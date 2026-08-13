import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DiagnosticsService } from './diagnostics.service';
import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsJob } from '../entities/diagnostics-job.entity';
import { ChargePoint } from '../entities/charge-point.entity';
import { ChargePointsModule } from '../charge-points/charge-points.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { resolveJwtSecret } from '../common/utils/jwt-secret';

@Module({
  imports: [
    TypeOrmModule.forFeature([DiagnosticsJob, ChargePoint]),
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
  controllers: [DiagnosticsController],
  providers: [DiagnosticsService, JwtAuthGuard, RolesGuard],
  exports: [DiagnosticsService],
})
export class DiagnosticsModule {}
