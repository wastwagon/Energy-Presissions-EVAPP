import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, LessThan, MoreThan } from 'typeorm';
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
    vendorId?: number;
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
      // relations: ['vendor'], // Commented out to avoid relation errors if vendor doesn't exist
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
      relations: ['vendor'],
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
        // Removed relations to avoid potential issues if vendor doesn't exist
        // relations: ['vendor'],
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

  /**
   * Delete resolved connection errors
   * Deletes errors that are older than specified hours and have been resolved
   * (i.e., device has successfully connected since the error)
   * 
   * If requireResolution is false, deletes errors by age and error code only
   */
  async deleteResolvedErrors(
    olderThanHours: number = 24, 
    errorCode?: string,
    requireResolution: boolean = true
  ): Promise<{ deleted: number }> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

    // Find errors older than cutoff date
    const where: any = {
      eventType: 'connection_failed',
      createdAt: LessThan(cutoffDate),
    };

    if (errorCode) {
      where.errorCode = errorCode;
    }

    // Get all error logs matching criteria
    const errors = await this.connectionLogRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    if (errors.length === 0) {
      return { deleted: 0 };
    }

    // If not requiring resolution check, delete all matching errors
    if (!requireResolution) {
      const errorIds = errors.map(e => e.id);
      await this.connectionLogRepository.delete(errorIds);
      this.logger.log(`Deleted ${errorIds.length} connection errors older than ${olderThanHours} hours (without resolution check)`);
      return { deleted: errorIds.length };
    }

    // Check which errors are resolved (device has connected successfully since error)
    const resolvedErrors: number[] = [];
    
    for (const error of errors) {
      let isResolved = false;

      // Check if device has successfully connected after this error
      if (error.chargePointId !== 'UNKNOWN') {
        const successAfterError = await this.connectionLogRepository.findOne({
          where: {
            chargePointId: error.chargePointId,
            eventType: 'connection_success',
            createdAt: MoreThan(error.createdAt),
          },
          order: { createdAt: 'DESC' },
        });
        if (successAfterError) {
          isResolved = true;
        }
      }

      // Also check by error message pattern if chargePointId is UNKNOWN
      if (!isResolved && error.chargePointId === 'UNKNOWN' && error.errorMessage) {
        // Extract charge point ID from error message if possible
        const match = error.errorMessage.match(/\/ocpp\/([^\/\s]+)/);
        if (match && match[1]) {
          const extractedId = match[1];
          const successAfterErrorByMessage = await this.connectionLogRepository.findOne({
            where: {
              chargePointId: extractedId,
              eventType: 'connection_success',
              createdAt: MoreThan(error.createdAt),
            },
            order: { createdAt: 'DESC' },
          });
          if (successAfterErrorByMessage) {
            isResolved = true;
          }
        }
      }

      if (isResolved) {
        resolvedErrors.push(error.id);
      }
    }

    // Delete resolved errors
    if (resolvedErrors.length > 0) {
      await this.connectionLogRepository.delete(resolvedErrors);
      this.logger.log(`Deleted ${resolvedErrors.length} resolved connection errors older than ${olderThanHours} hours`);
    }

    return { deleted: resolvedErrors.length };
  }

  /**
   * Delete a specific error log by ID
   */
  async deleteError(id: number): Promise<void> {
    await this.connectionLogRepository.delete(id);
    this.logger.log(`Deleted connection error log with ID ${id}`);
  }
}



