import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConnectionLogsService } from './connection-logs.service';
import { ConnectionLogsController } from './connection-logs.controller';
import { ConnectionLog } from '../entities/connection-log.entity';
import { ConnectionStatistics } from '../entities/connection-statistics.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConnectionLog, ConnectionStatistics])],
  controllers: [ConnectionLogsController],
  providers: [ConnectionLogsService],
  exports: [ConnectionLogsService],
})
export class ConnectionLogsModule {}



