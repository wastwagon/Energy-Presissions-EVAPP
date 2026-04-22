import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuditLog } from '../entities/audit-log.entity';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { resolveJwtSecret } from '../common/utils/jwt-secret';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: resolveJwtSecret(config),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuditController],
  providers: [AuditService, JwtAuthGuard, RolesGuard],
  exports: [AuditService],
})
export class AuditModule {}
