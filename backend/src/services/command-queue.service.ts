import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PendingCommand, CommandStatus } from '../entities/pending-command.entity';
import { ChargePointsService } from '../charge-points/charge-points.service';
import { ConfigService } from '@nestjs/config';
import { TenantStatusService } from '../tenants/tenant-status.service';
import axios from 'axios';

@Injectable()
export class CommandQueueService {
  private readonly logger = new Logger(CommandQueueService.name);
  private ocppGatewayUrl: string;

  constructor(
    @InjectRepository(PendingCommand)
    private pendingCommandRepository: Repository<PendingCommand>,
    private chargePointsService: ChargePointsService,
    private configService: ConfigService,
    private tenantStatusService: TenantStatusService,
  ) {
    this.ocppGatewayUrl = process.env.OCPP_GATEWAY_URL || 'http://ocpp-gateway:9000';
  }

  /**
   * Queue a command for later execution when charge point comes online
   */
  async queueCommand(
    chargePointId: string,
    action: string,
    payload: any,
    expiresInMinutes: number = 60,
  ): Promise<PendingCommand> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    const command = this.pendingCommandRepository.create({
      chargePointId,
      action,
      payload,
      status: CommandStatus.PENDING,
      expiresAt,
    });

    return this.pendingCommandRepository.save(command);
  }

  /**
   * Check if charge point is online and send command immediately, otherwise queue it
   */
  async sendOrQueueCommand(
    chargePointId: string,
    action: string,
    payload: any,
  ): Promise<{ queued: boolean; commandId?: number; result?: any }> {
    // Check if charge point is online
    const isOnline = await this.isChargePointOnline(chargePointId);

    if (isOnline) {
      try {
        // Try to send command immediately
        const messageId = `${action}-${Date.now()}`;
        const message = [2, messageId, action, payload];

        const response = await axios.post(
          `${this.ocppGatewayUrl}/command/${chargePointId}`,
          { message },
          { timeout: 35000 },
        );

        if (response.data.success) {
          return { queued: false, result: response.data.response };
        } else {
          // If command fails, queue it
          const command = await this.queueCommand(chargePointId, action, payload);
          return { queued: true, commandId: command.id };
        }
      } catch (error) {
        // If charge point is not connected, queue the command
        if (axios.isAxiosError(error) && error.response?.status === 503) {
          const command = await this.queueCommand(chargePointId, action, payload);
          return { queued: true, commandId: command.id };
        }
        throw error;
      }
    } else {
      // Charge point is offline, queue the command
      const command = await this.queueCommand(chargePointId, action, payload);
      return { queued: true, commandId: command.id };
    }
  }

  /**
   * Process pending commands for a charge point (called when it comes online)
   * Skips commands if tenant is disabled or suspended
   */
  async processPendingCommands(chargePointId: string): Promise<number> {
    // Get charge point to resolve tenantId
    try {
      const chargePoint = await this.chargePointsService.findOne(chargePointId);
      
      // Check tenant status
      if (chargePoint.tenantId) {
        const tenantStatus = await this.tenantStatusService.getTenantStatus(chargePoint.tenantId);
        
        if (tenantStatus === 'disabled') {
          this.logger.warn(
            `Skipping pending commands for charge point ${chargePointId} - tenant ${chargePoint.tenantId} is disabled`,
          );
          // Cancel all pending commands
          await this.pendingCommandRepository.update(
            { chargePointId, status: CommandStatus.PENDING },
            { status: CommandStatus.CANCELLED },
          );
          return 0;
        }
        
        if (tenantStatus === 'suspended') {
          this.logger.warn(
            `Skipping pending commands for charge point ${chargePointId} - tenant ${chargePoint.tenantId} is suspended`,
          );
          // Cancel all pending commands
          await this.pendingCommandRepository.update(
            { chargePointId, status: CommandStatus.PENDING },
            { status: CommandStatus.CANCELLED },
          );
          return 0;
        }
      }
    } catch (error) {
      this.logger.error(`Error checking tenant status for charge point ${chargePointId}:`, error);
      // Continue processing if tenant check fails (backward compatibility)
    }

    const pendingCommands = await this.pendingCommandRepository.find({
      where: {
        chargePointId,
        status: CommandStatus.PENDING,
        // Only process non-expired commands (expiresAt > now)
      },
      order: { createdAt: 'ASC' },
      take: 10, // Process up to 10 commands at a time
    });

    // Filter out expired commands
    const now = new Date();
    const validCommands = pendingCommands.filter(cmd => !cmd.expiresAt || cmd.expiresAt > now);

    let processedCount = 0;

    for (const command of validCommands) {
      try {
        // Mark as processing
        command.status = CommandStatus.PROCESSING;
        await this.pendingCommandRepository.save(command);

        // Send command
        const messageId = `${command.action}-${command.id}-${Date.now()}`;
        const message = [2, messageId, command.action, command.payload];

        const response = await axios.post(
          `${this.ocppGatewayUrl}/command/${chargePointId}`,
          { message },
          { timeout: 35000 },
        );

        if (response.data.success) {
          command.status = CommandStatus.COMPLETED;
          command.response = response.data.response;
          command.processedAt = new Date();
          processedCount++;
        } else {
          // Retry logic
          command.retryCount++;
          if (command.retryCount >= command.maxRetries) {
            command.status = CommandStatus.FAILED;
            command.errorMessage = response.data.error || 'Command failed';
          } else {
            command.status = CommandStatus.PENDING;
          }
        }
      } catch (error: any) {
        command.retryCount++;
        if (command.retryCount >= command.maxRetries) {
          command.status = CommandStatus.FAILED;
          command.errorMessage = error.message || 'Command failed';
        } else {
          command.status = CommandStatus.PENDING;
        }
      }

      await this.pendingCommandRepository.save(command);
    }

    return processedCount;
  }

  /**
   * Get pending commands for a charge point
   */
  async getPendingCommands(chargePointId: string): Promise<PendingCommand[]> {
    return this.pendingCommandRepository.find({
      where: {
        chargePointId,
        status: CommandStatus.PENDING,
      },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Cancel a pending command
   */
  async cancelCommand(commandId: number): Promise<void> {
    const command = await this.pendingCommandRepository.findOne({
      where: { id: commandId },
    });

    if (command && command.status === CommandStatus.PENDING) {
      command.status = CommandStatus.CANCELLED;
      await this.pendingCommandRepository.save(command);
    }
  }

  /**
   * Check if charge point is online (by checking connection state or last heartbeat)
   */
  private async isChargePointOnline(chargePointId: string): Promise<boolean> {
    try {
      // Check OCPP Gateway connection status
      const response = await axios.get(
        `${this.ocppGatewayUrl}/health/connection/${chargePointId}`,
        { timeout: 5000 },
      );
      return response.data.connected === true;
    } catch (error) {
      // If health check fails, assume offline
      return false;
    }
  }

  /**
   * Clean up expired commands
   */
  async cleanupExpiredCommands(): Promise<number> {
    const result = await this.pendingCommandRepository.update(
      {
        status: CommandStatus.PENDING,
        expiresAt: LessThan(new Date()),
      },
      {
        status: CommandStatus.FAILED,
        errorMessage: 'Command expired',
      },
    );

    return result.affected || 0;
  }
}

