import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ConnectionLogsService } from './connection-logs.service';
import { ConnectionLog, ConnectionEventType } from '../entities/connection-log.entity';
import { ConnectionStatistics } from '../entities/connection-statistics.entity';

@ApiTags('Connection Logs')
@Controller('connection-logs')
export class ConnectionLogsController {
  constructor(private readonly connectionLogsService: ConnectionLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get connection logs' })
  @ApiQuery({ name: 'chargePointId', required: false, type: String })
  @ApiQuery({ name: 'eventType', required: false, enum: ['connection_attempt', 'connection_success', 'connection_failed', 'connection_closed', 'error', 'message_error'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of connection logs' })
  async getLogs(
    @Query('chargePointId') chargePointId?: string,
    @Query('eventType') eventType?: ConnectionEventType,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.connectionLogsService.getLogs(
      chargePointId,
      eventType,
      limit ? parseInt(limit.toString()) : 100,
      offset ? parseInt(offset.toString()) : 0,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search connection logs' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search term' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchLogs(
    @Query('q') searchTerm: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.connectionLogsService.searchLogs(
      searchTerm,
      limit ? parseInt(limit.toString()) : 100,
      offset ? parseInt(offset.toString()) : 0,
    );
  }

  @Get('statistics/:chargePointId')
  @ApiOperation({ summary: 'Get connection statistics for a charge point' })
  @ApiResponse({ status: 200, description: 'Connection statistics', type: ConnectionStatistics })
  async getStatistics(@Param('chargePointId') chargePointId: string) {
    return this.connectionLogsService.getStatistics(chargePointId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get all connection statistics' })
  @ApiResponse({ status: 200, description: 'List of connection statistics', type: [ConnectionStatistics] })
  async getAllStatistics() {
    return this.connectionLogsService.getAllStatistics();
  }

  @Get('errors/recent')
  @ApiOperation({ summary: 'Get recent connection errors' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Recent errors', type: [ConnectionLog] })
  async getRecentErrors(@Query('limit') limit?: number) {
    return this.connectionLogsService.getRecentErrors(limit ? parseInt(limit.toString()) : 50);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get connection health summary' })
  @ApiResponse({ status: 200, description: 'Health summary' })
  async getHealthSummary() {
    return this.connectionLogsService.getHealthSummary();
  }
}



