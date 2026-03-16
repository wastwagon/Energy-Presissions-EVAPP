import {
  Controller,
  Get,
  Delete,
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

  @Delete('errors/resolved')
  @ApiOperation({ summary: 'Delete resolved connection errors' })
  @ApiQuery({ name: 'olderThanHours', required: false, type: Number, description: 'Delete errors older than X hours (default: 24)' })
  @ApiQuery({ name: 'errorCode', required: false, type: String, description: 'Delete errors with specific error code' })
  @ApiQuery({ name: 'requireResolution', required: false, type: Boolean, description: 'Require successful connection after error (default: true). Set to false to delete by age only.' })
  @ApiResponse({ status: 200, description: 'Number of errors deleted' })
  async deleteResolvedErrors(
    @Query('olderThanHours') olderThanHours?: number,
    @Query('errorCode') errorCode?: string,
    @Query('requireResolution') requireResolution?: string,
  ) {
    const requireResolutionBool = requireResolution !== 'false'; // Default to true
    return this.connectionLogsService.deleteResolvedErrors(
      olderThanHours ? parseInt(olderThanHours.toString()) : 24,
      errorCode,
      requireResolutionBool,
    );
  }

  @Delete('errors/:id')
  @ApiOperation({ summary: 'Delete a specific error log' })
  @ApiResponse({ status: 200, description: 'Error deleted successfully' })
  async deleteError(@Param('id', ParseIntPipe) id: number) {
    return this.connectionLogsService.deleteError(id);
  }
}



