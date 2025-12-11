import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { ConnectionLog, ConnectionEventType, ConnectionStatus } from '../entities/connection-log.entity';
import { ConnectionStatistics } from '../entities/connection-statistics.entity';

@Injectable()
export class ConnectionLogsService {
  private readonly logger = new Logger(ConnectionLogsService.name);

  constructor(
    @InjectRepository(ConnectionLog)
    private connectionLogRepository: Repository<ConnectionLog>,
    @InjectRepository(ConnectionStatistics)
    private connectionStatisticsRepository: Repository<ConnectionStatistics>,
  ) {}

  /**
   * Log a connection event
   */
  async logEvent(data: {
    chargePointId: string;
    eventType: ConnectionEventType;
    status?: ConnectionStatus;
    errorCode?: string;
    errorMessage?: string;
    closeCode?: number;
    closeReason?: string;
    ipAddress?: string;
    userAgent?: string;
    requestUrl?: string;
    tenantId?: number;
    metadata?: Record<string, any>;
  }): Promise<ConnectionLog> {
    const log = this.connectionLogRepository.create(data);
    return this.connectionLogRepository.save(log);
  }

  /**
   * Get connection logs for a charge point
   */
  async getLogs(
    chargePointId?: string,
    eventType?: ConnectionEventType,
    limit: number = 100,
    offset: number = 0,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ logs: ConnectionLog[]; total: number }> {
    const where: any = {};

    if (chargePointId) {
      where.chargePointId = chargePointId;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    const [logs, total] = await this.connectionLogRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['tenant'],
    });

    return { logs, total };
  }

  /**
   * Search connection logs
   */
  async searchLogs(
    searchTerm: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ logs: ConnectionLog[]; total: number }> {
    const [logs, total] = await this.connectionLogRepository.findAndCount({
      where: [
        { chargePointId: Like(`%${searchTerm}%`) },
        { errorMessage: Like(`%${searchTerm}%`) },
        { errorCode: Like(`%${searchTerm}%`) },
        { closeReason: Like(`%${searchTerm}%`) },
      ],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['tenant'],
    });

    return { logs, total };
  }

  /**
   * Get connection statistics for a charge point
   */
  async getStatistics(chargePointId: string): Promise<ConnectionStatistics | null> {
    return this.connectionStatisticsRepository.findOne({
      where: { chargePointId },
    });
  }

  /**
   * Get all connection statistics
   */
  async getAllStatistics(): Promise<ConnectionStatistics[]> {
    return this.connectionStatisticsRepository.find({
      order: { updatedAt: 'DESC' },
    });
  }

  /**
   * Get recent errors for debugging
   */
  async getRecentErrors(limit: number = 50): Promise<ConnectionLog[]> {
    try {
      return await this.connectionLogRepository.find({
        where: [
          { eventType: 'error' },
          { eventType: 'connection_failed' },
          { eventType: 'message_error' },
        ],
        order: { createdAt: 'DESC' },
        take: limit,
        // Removed relations to avoid potential issues if tenant doesn't exist
        // relations: ['tenant'],
      });
    } catch (error) {
      this.logger.error(`Error fetching recent connection errors: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get connection health summary
   */
  async getHealthSummary(): Promise<{
    totalDevices: number;
    devicesWithErrors: number;
    recentFailures: number;
    averageSuccessRate: number;
  }> {
    const stats = await this.connectionStatisticsRepository.find();
    
    const totalDevices = stats.length;
    const devicesWithErrors = stats.filter(s => s.consecutiveFailures > 0).length;
    const recentFailures = stats.filter(s => {
      if (!s.lastFailedConnection) return false;
      const hoursSinceFailure = (Date.now() - s.lastFailedConnection.getTime()) / (1000 * 60 * 60);
      return hoursSinceFailure < 24; // Last 24 hours
    }).length;

    const totalAttempts = stats.reduce((sum, s) => sum + s.totalAttempts, 0);
    const totalSuccesses = stats.reduce((sum, s) => sum + s.successfulConnections, 0);
    const averageSuccessRate = totalAttempts > 0 ? (totalSuccesses / totalAttempts) * 100 : 0;

    return {
      totalDevices,
      devicesWithErrors,
      recentFailures,
      averageSuccessRate: Math.round(averageSuccessRate * 100) / 100,
    };
  }
}



