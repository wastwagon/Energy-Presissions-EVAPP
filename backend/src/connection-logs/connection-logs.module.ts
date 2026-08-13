import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConnectionLogsService } from './connection-logs.service';
import { ConnectionLogsController } from './connection-logs.controller';
import { ConnectionLog } from '../entities/connection-log.entity';
import { ConnectionStatistics } from '../entities/connection-statistics.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { resolveJwtSecret } from '../common/utils/jwt-secret';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConnectionLog, ConnectionStatistics]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: resolveJwtSecret(config),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ConnectionLogsController],
  providers: [ConnectionLogsService, JwtAuthGuard, RolesGuard],
  exports: [ConnectionLogsService],
})
export class ConnectionLogsModule {}
