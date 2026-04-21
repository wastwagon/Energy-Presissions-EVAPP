import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChargePoint } from '../entities/charge-point.entity';
import { Connector } from '../entities/connector.entity';
import { Transaction } from '../entities/transaction.entity';
import { MeterSample } from '../entities/meter-sample.entity';
import { IdTag } from '../entities/id-tag.entity';
import { BillingService } from '../billing/billing.service';
import { ReservationsService } from '../reservations/reservations.service';
import { LocalAuthListService } from '../local-auth-list/local-auth-list.service';
import { VendorsService } from '../vendors/vendors.service';
import { ConnectionLogsService } from '../connection-logs/connection-logs.service';
import { WalletService } from '../wallet/wallet.service';
import { WalletTransaction } from '../entities/wallet-transaction.entity';
import { User } from '../entities/user.entity';
import { ConnectionEventType, ConnectionStatus } from '../entities/connection-log.entity';

@Injectable()
export class InternalService {
  private readonly logger = new Logger(InternalService.name);
  private commandQueueService: any;
  private websocketGateway: any;
  private chargePointsService: any; // ChargePointsService - injected via setter to avoid circular dependency

  constructor(
    @InjectRepository(ChargePoint)
    private chargePointRepository: Repository<ChargePoint>,
    @InjectRepository(Connector)
    private connectorRepository: Repository<Connector>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(MeterSample)
    private meterSampleRepository: Repository<MeterSample>,
    @InjectRepository(IdTag)
    private idTagRepository: Repository<IdTag>,
    @InjectRepository(WalletTransaction)
    private walletTransactionRepository: Repository<WalletTransaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private billingService: BillingService,
    private reservationsService: ReservationsService,
    private localAuthListService: LocalAuthListService,
    private vendorsService: VendorsService,
    private connectionLogsService: ConnectionLogsService,
    private walletService: WalletService,
  ) {}

  // Set ChargePointsService (injected via setter to avoid circular dependency)
  setChargePointsService(service: any) {
    this.chargePointsService = service;
  }

  // Set WebSocket gateway (injected via setter to avoid circular dependency)
  setWebSocketGateway(gateway: any) {
    this.websocketGateway = gateway;
  }

  // Set command queue service (injected via setter to avoid circular dependency)
  setCommandQueueService(service: any) {
    this.commandQueueService = service;
  }

  async upsertChargePoint(data: {
    chargePointId: string;
    vendor?: string;
    model?: string;
    serialNumber?: string;
    firmwareVersion?: string;
    iccid?: string;
    imsi?: string;
  }) {
    let chargePoint = await this.chargePointRepository.findOne({
      where: { chargePointId: data.chargePointId },
    });

    if (chargePoint) {
      // Update existing
      Object.assign(chargePoint, {
        vendorName: data.vendor || chargePoint.vendorName,
        model: data.model || chargePoint.model,
        serialNumber: data.serialNumber || chargePoint.serialNumber,
        firmwareVersion: data.firmwareVersion || chargePoint.firmwareVersion,
        iccid: data.iccid || chargePoint.iccid,
        imsi: data.imsi || chargePoint.imsi,
        lastSeen: new Date(),
        status: 'Available',
      });
    } else {
      // Create new
      chargePoint = this.chargePointRepository.create({
        chargePointId: data.chargePointId,
        vendorName: data.vendor,
        model: data.model,
        serialNumber: data.serialNumber,
        firmwareVersion: data.firmwareVersion,
        iccid: data.iccid,
        imsi: data.imsi,
      lastSeen: new Date(),
      status: 'Available',
    });
  }

  await this.chargePointRepository.save(chargePoint);

  // Process pending commands if command queue service is available
  if (this.commandQueueService) {
    try {
      const processedCount = await this.commandQueueService.processPendingCommands(data.chargePointId);
      if (processedCount > 0) {
        this.logger.log(`Processed ${processedCount} pending commands for ${data.chargePointId}`);
      }
    } catch (error) {
      this.logger.error(`Error processing pending commands for ${data.chargePointId}:`, error);
    }
  }

  // Broadcast charge point status update
  if (this.websocketGateway) {
    try {
      this.websocketGateway.broadcastChargePointStatus({
        chargePointId: chargePoint.chargePointId,
        status: chargePoint.status,
        lastSeen: chargePoint.lastSeen,
        lastHeartbeat: chargePoint.lastHeartbeat,
      });
    } catch (error) {
      this.logger.error(`Error broadcasting charge point status:`, error);
    }
  }

  return chargePoint;
}

  async getChargePointVendor(chargePointId: string): Promise<{ id: number; chargePointId: string; vendorId: number }> {
    const chargePoint = await this.chargePointRepository.findOne({
      where: { chargePointId },
      select: ['id', 'chargePointId', 'vendorId'],
    });

    if (!chargePoint) {
      throw new Error(`Charge point ${chargePointId} not found`);
    }

    const vendorId = chargePoint.vendorId;
    if (vendorId == null || Number(vendorId) < 1) {
      throw new BadRequestException(
        `Charge point ${chargePointId} has no valid vendor_id. Assign a vendor before using this device.`,
      );
    }

    return {
      id: chargePoint.id,
      chargePointId: chargePoint.chargePointId,
      vendorId,
    };
  }

  async getVendorStatus(vendorId: number): Promise<{ status: string; reason?: string; effectiveAt: Date }> {
    return this.vendorsService.getStatus(vendorId);
  }

  async getChargePointStatus(chargePointId: string) {
    const chargePoint = await this.chargePointRepository.findOne({
      where: { chargePointId },
      relations: ['connectors'],
    });

    if (!chargePoint) {
      throw new Error(`Charge point ${chargePointId} not found`);
    }

    const connectors = await this.connectorRepository.find({
      where: { chargePointId },
    });

    const activeTransactions = await this.transactionRepository.count({
      where: {
        chargePointId,
        status: 'Active',
      },
    });

    return {
      chargePoint: {
        id: chargePoint.chargePointId,
        status: chargePoint.status,
        lastSeen: chargePoint.lastSeen,
        lastHeartbeat: chargePoint.lastHeartbeat,
      },
      connectors: connectors.map((c) => ({
        connectorId: c.connectorId,
        status: c.status,
        errorCode: c.errorCode,
      })),
      activeTransactions,
    };
  }

  async updateChargePointStatus(
    chargePointId: string,
    data: {
      connectorId: number;
      status: string;
      errorCode?: string;
      vendorErrorCode?: string;
      timestamp?: string;
    },
  ) {
    if (data.connectorId === 0) {
      // Charge point level status
      const chargePoint = await this.chargePointRepository.findOne({
        where: { chargePointId },
      });
      if (chargePoint) {
        chargePoint.status = data.status;
        chargePoint.lastSeen = new Date();
        await this.chargePointRepository.save(chargePoint);
      }
    } else {
      // Connector level status
      let connector = await this.connectorRepository.findOne({
        where: { chargePointId, connectorId: data.connectorId },
      });

      if (!connector) {
        connector = this.connectorRepository.create({
          chargePointId,
          connectorId: data.connectorId,
          status: data.status,
          errorCode: data.errorCode,
          vendorErrorCode: data.vendorErrorCode,
          lastStatusUpdate: new Date(),
        });
      } else {
        connector.status = data.status;
        connector.errorCode = data.errorCode;
        connector.vendorErrorCode = data.vendorErrorCode;
        connector.lastStatusUpdate = new Date();
      }

      await this.connectorRepository.save(connector);

      // Broadcast connector status update
      if (this.websocketGateway) {
        try {
          this.websocketGateway.broadcastConnectorStatus({
            chargePointId,
            connectorId: data.connectorId,
            status: connector.status,
            errorCode: connector.errorCode,
          });
          
          // Also broadcast charge point status for dashboard updates
          const chargePoint = await this.chargePointRepository.findOne({
            where: { chargePointId },
          });
          if (chargePoint) {
            this.websocketGateway.broadcastChargePointStatus({
              chargePointId,
              status: chargePoint.status,
              lastSeen: chargePoint.lastSeen,
              lastHeartbeat: chargePoint.lastHeartbeat,
            });
          }
        } catch (error) {
          this.logger.error(`Error broadcasting connector status:`, error);
        }
      }
    }
  }

  async authorizeIdTag(idTag: string) {
    const idTagEntity = await this.idTagRepository.findOne({
      where: { idTag },
    });

    if (!idTagEntity) {
      return {
        status: 'Invalid',
      };
    }

    // Check expiry
    if (idTagEntity.expiryDate && new Date(idTagEntity.expiryDate) < new Date()) {
      return {
        status: 'Expired',
      };
    }

    return {
      status: idTagEntity.status,
      expiryDate: idTagEntity.expiryDate?.toISOString(),
      parentIdTag: idTagEntity.parentIdTag,
    };
  }

  async createTransaction(data: {
    chargePointId: string;
    connectorId: number;
    idTag: string;
    meterStart: number;
    startTime: string;
    reservationId?: number;
  }) {
    // Get user from IdTag
    const idTagEntity = await this.idTagRepository.findOne({
      where: { idTag: data.idTag },
      relations: ['user'],
    });

    // Generate transaction ID (use database sequence or timestamp-based ID)
    // Get the next transaction ID by finding max and adding 1, or use a sequence
    const maxTransaction = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('MAX(transaction.transactionId)', 'maxId')
      .getRawOne();
    
    const nextTransactionId = maxTransaction?.maxId ? parseInt(maxTransaction.maxId) + 1 : 1;

    const transaction = this.transactionRepository.create({
      transactionId: nextTransactionId,
      chargePointId: data.chargePointId,
      connectorId: data.connectorId,
      idTag: data.idTag,
      userId: idTagEntity?.user?.id,
      meterStart: data.meterStart,
      startTime: new Date(data.startTime),
      status: 'Active',
      reservationId: data.reservationId,
    });

    const saved = await this.transactionRepository.save(transaction);

    // Check if there's a pending wallet reservation for this user/charge point
    // This handles the case where wallet-start was called but transaction wasn't created yet
    if (saved.userId && saved.idTag) {
      try {
        // Look for a recent pending wallet reservation (within last 2 minutes) for this user
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const pendingReservation = await this.walletTransactionRepository
          .createQueryBuilder('wt')
          .where('wt.userId = :userId', { userId: saved.userId })
          .andWhere('wt.type = :type', { type: 'RESERVATION' })
          .andWhere('wt.status = :status', { status: 'PENDING' })
          .andWhere('wt.transactionId IS NULL')
          .andWhere('wt.createdAt >= :twoMinutesAgo', { twoMinutesAgo })
          .orderBy('wt.createdAt', 'DESC')
          .getOne();

        if (pendingReservation) {
          // Update transaction with reserved amount
          saved.walletReservedAmount = pendingReservation.amount;
          await this.transactionRepository.save(saved);

          // Link the reservation to this transaction
          pendingReservation.transactionId = saved.transactionId;
          await this.walletTransactionRepository.save(pendingReservation);

          this.logger.log(`Linked wallet reservation ${pendingReservation.id} (${pendingReservation.amount} GHS) to transaction ${saved.transactionId}`);
        } else {
          // Also check for reservations without transactionId (created before transaction)
          const unlinkedReservation = await this.walletTransactionRepository
            .createQueryBuilder('wt')
            .where('wt.userId = :userId', { userId: saved.userId })
            .andWhere('wt.type = :type', { type: 'RESERVATION' })
            .andWhere('wt.status = :status', { status: 'PENDING' })
            .andWhere('wt.transactionId IS NULL')
            .andWhere('wt.createdAt >= :twoMinutesAgo', { twoMinutesAgo })
            .orderBy('wt.createdAt', 'DESC')
            .getOne();

          if (unlinkedReservation) {
            saved.walletReservedAmount = unlinkedReservation.amount;
            await this.transactionRepository.save(saved);
            unlinkedReservation.transactionId = saved.transactionId;
            await this.walletTransactionRepository.save(unlinkedReservation);
            this.logger.log(`Linked unlinked wallet reservation ${unlinkedReservation.id} (${unlinkedReservation.amount} GHS) to transaction ${saved.transactionId}`);
          }
        }
      } catch (error) {
        this.logger.error(`Error checking for pending wallet reservation:`, error);
        // Don't fail transaction creation if reservation check fails
      }
    }

    // Get charge point for vendorId
    const chargePoint = await this.chargePointRepository.findOne({
      where: { chargePointId: saved.chargePointId },
    });

    // Broadcast transaction started
    if (this.websocketGateway) {
      try {
        this.logger.log(`Broadcasting transaction started for ${saved.transactionId}`);
        this.websocketGateway.broadcastTransactionStarted({
          transactionId: saved.transactionId,
          chargePointId: saved.chargePointId,
          userId: saved.userId || undefined,
          vendorId: chargePoint?.vendorId || undefined,
          startTime: saved.startTime,
        });

        // Broadcast dashboard stats update to refresh dashboards
        this.logger.log(`Broadcasting dashboard stats update for transaction ${saved.transactionId}`);
        this.websocketGateway.broadcastDashboardStatsUpdate({
          vendorId: chargePoint?.vendorId || undefined,
          stats: {
            transactionId: saved.transactionId,
            status: 'started',
          },
        });
      } catch (error) {
        this.logger.error(`Error broadcasting transaction started:`, error);
      }
    } else {
      this.logger.warn(`WebSocket gateway not available for transaction ${saved.transactionId}`);
    }

    return { transactionId: saved.transactionId };
  }

  async stopTransaction(
    transactionId: number,
    data: {
      meterStop: number;
      stopTime: string;
      reason?: string;
      transactionData?: any[];
    },
  ) {
    const transaction = await this.transactionRepository.findOne({
      where: { transactionId },
    });

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const stopTime = new Date(data.stopTime);
    const startTime = transaction.startTime;
    const durationMs = stopTime.getTime() - startTime.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);

    const energyWh = data.meterStop - transaction.meterStart;
    const energyKwh = energyWh / 1000;

    transaction.meterStop = data.meterStop;
    transaction.stopTime = stopTime;
    transaction.totalEnergyKwh = energyKwh;
    transaction.durationMinutes = durationMinutes;
    transaction.status = 'Completed';
    transaction.reason = data.reason;

    // Calculate cost based on tariff or charge point price
    let finalCost = 0;
    try {
      // Try to use charge point specific price first
      const chargePoint = await this.chargePointRepository.findOne({
        where: { chargePointId: transaction.chargePointId },
      });

      if (chargePoint?.pricePerKwh) {
        // Use charge point specific price
        finalCost = energyKwh * parseFloat(chargePoint.pricePerKwh.toString());
      } else {
        // Fall back to tariff calculation
        const { totalCost } = await this.billingService.calculateCost(
          energyKwh,
          durationMinutes,
          startTime,
          transaction.currency,
        );
        finalCost = totalCost;
      }
      transaction.totalCost = finalCost;
    } catch (error) {
      // If tariff not found, calculate using charge point price or set to 0
      this.logger.error(`Failed to calculate cost for transaction ${transactionId}:`, error);
      const chargePoint = await this.chargePointRepository.findOne({
        where: { chargePointId: transaction.chargePointId },
      });
      if (chargePoint?.pricePerKwh) {
        finalCost = energyKwh * parseFloat(chargePoint.pricePerKwh.toString());
        transaction.totalCost = finalCost;
      } else {
        transaction.totalCost = 0;
      }
    }

    // Handle wallet-based transaction finalization
    if (transaction.walletReservedAmount && transaction.userId) {
      try {
        // Find the wallet reservation for this transaction
        const walletReservations = await this.walletTransactionRepository.find({
          where: {
            userId: transaction.userId,
            transactionId: transaction.transactionId,
            type: 'Reservation' as any,
            status: 'Pending' as any,
          },
        });

        if (walletReservations.length > 0) {
          const reservation = walletReservations[0];
          
          // Cap the final cost at the reserved amount (user should never pay more than reserved)
          const cappedCost = Math.min(finalCost, transaction.walletReservedAmount);
          
          // Finalize the reservation with capped cost
          await this.walletService.finalizeReservation(
            reservation.id,
            cappedCost,
            `Charging session completed - ${energyKwh.toFixed(2)} kWh at ${transaction.chargePointId}`,
          );

          // Update transaction with capped cost
          transaction.totalCost = cappedCost;

          const refundAmount = transaction.walletReservedAmount - cappedCost;
          this.logger.log(
            `Finalized wallet reservation for transaction ${transactionId}. Reserved: ${transaction.walletReservedAmount}, Actual Cost: ${finalCost.toFixed(2)}, Capped Cost: ${cappedCost.toFixed(2)}, Refunded: ${refundAmount.toFixed(2)}`,
          );
        } else {
          // If no reservation found, create a direct payment record
          this.logger.warn(`No reservation found for transaction ${transactionId}, creating direct payment`);
          await this.walletService.deduct(
            transaction.userId,
            finalCost,
            `Charging session - ${energyKwh.toFixed(2)} kWh at ${transaction.chargePointId}`,
            undefined,
            transaction.transactionId,
          );
        }
      } catch (error) {
        this.logger.error(`Failed to finalize wallet reservation for transaction ${transactionId}:`, error);
        // Don't fail the transaction stop if wallet finalization fails
      }
    }

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Get charge point for vendorId
    const chargePoint = await this.chargePointRepository.findOne({
      where: { chargePointId: savedTransaction.chargePointId },
    });

    // Broadcast transaction stopped
    if (this.websocketGateway) {
      try {
        this.logger.log(`Broadcasting transaction stopped for ${savedTransaction.transactionId}`);
        this.websocketGateway.broadcastTransactionStopped({
          transactionId: savedTransaction.transactionId,
          chargePointId: savedTransaction.chargePointId,
          totalEnergyKwh: savedTransaction.totalEnergyKwh,
          totalCost: savedTransaction.totalCost,
          stopTime: savedTransaction.stopTime!,
          userId: savedTransaction.userId || undefined,
          vendorId: chargePoint?.vendorId || undefined,
        });

        // Broadcast wallet balance update if wallet-based transaction
        if (savedTransaction.userId && savedTransaction.walletReservedAmount) {
          try {
            const user = await this.userRepository.findOne({
              where: { id: savedTransaction.userId },
            });
            if (user) {
              this.websocketGateway.broadcastWalletBalanceUpdate({
                userId: user.id,
                balance: user.balance,
                currency: user.currency,
                transactionId: savedTransaction.transactionId,
              });
            }
          } catch (error) {
            this.logger.error(`Error broadcasting wallet balance update:`, error);
          }
        }

        // Broadcast dashboard stats update to refresh all dashboards
        try {
          this.logger.log(`Broadcasting dashboard stats update for transaction ${savedTransaction.transactionId}`);
          this.websocketGateway.broadcastDashboardStatsUpdate({
            vendorId: chargePoint?.vendorId || undefined,
            stats: {
              transactionId: savedTransaction.transactionId,
              status: 'completed',
            },
          });
        } catch (error) {
          this.logger.error(`Error broadcasting dashboard stats update:`, error);
        }
      } catch (error) {
        this.logger.error(`Error broadcasting transaction stopped:`, error);
      }
    } else {
      this.logger.warn(`WebSocket gateway not available for transaction ${savedTransaction.transactionId}`);
    }

    // Get IdTag info for response
    const idTagEntity = await this.idTagRepository.findOne({
      where: { idTag: transaction.idTag },
    });

    return {
      idTagInfo: idTagEntity
        ? {
            status: idTagEntity.status,
            expiryDate: idTagEntity.expiryDate?.toISOString(),
            parentIdTag: idTagEntity.parentIdTag,
          }
        : {},
    };
  }

  async storeMeterValues(data: {
    chargePointId: string;
    connectorId: number;
    transactionId?: number;
    meterValues: any[];
  }) {
    const samples: MeterSample[] = [];

    for (const meterValue of data.meterValues) {
      for (const sampledValue of meterValue.sampledValue || []) {
        const sample = this.meterSampleRepository.create({
          chargePointId: data.chargePointId,
          connectorId: data.connectorId,
          transactionId: data.transactionId,
          timestamp: new Date(meterValue.timestamp),
          measurand: sampledValue.measurand,
          location: sampledValue.location,
          phase: sampledValue.phase,
          unit: sampledValue.unit,
          value: parseFloat(sampledValue.value),
          context: sampledValue.context,
          format: sampledValue.format,
        });
        samples.push(sample);
      }
    }

    const savedSamples = await this.meterSampleRepository.save(samples);

    // Check for wallet-based transactions and stop if amount exhausted
    if (data.transactionId) {
      await this.checkAndStopWalletBasedTransaction(data.transactionId, data.chargePointId);
    }

    // Broadcast meter value (only for latest sample to avoid spam)
    if (this.websocketGateway && samples.length > 0) {
      try {
        const latestSample = samples[samples.length - 1];
        this.websocketGateway.broadcastMeterValue({
          transactionId: latestSample.transactionId || undefined,
          chargePointId: latestSample.chargePointId,
          connectorId: latestSample.connectorId,
          value: latestSample.value,
          measurand: latestSample.measurand,
          unit: latestSample.unit,
        });
      } catch (error) {
        this.logger.error(`Error broadcasting meter value:`, error);
      }
    }

    return savedSamples;
  }

  /**
   * Check if wallet-based transaction should be stopped due to amount exhaustion
   */
  private async checkAndStopWalletBasedTransaction(transactionId: number, chargePointId: string): Promise<void> {
    try {
      const transaction = await this.transactionRepository.findOne({
        where: { transactionId },
        relations: ['chargePoint'],
      });

      if (!transaction || transaction.status !== 'Active' || !transaction.walletReservedAmount) {
        return; // Not a wallet-based transaction or already stopped
      }

      const chargePoint = transaction.chargePoint;
      const pricePerKwh = chargePoint?.pricePerKwh || 0;

      if (!pricePerKwh || pricePerKwh <= 0) {
        return; // Cannot calculate without price
      }

      // Get latest energy meter value
      const latestEnergySample = await this.meterSampleRepository.findOne({
        where: {
          transactionId,
          measurand: 'Energy.Active.Import.Register',
        },
        order: { timestamp: 'DESC' },
      });

      if (!latestEnergySample) {
        return; // No energy meter values yet
      }

      // Calculate energy consumed (in kWh)
      const energyWh = latestEnergySample.value - transaction.meterStart;
      const energyKwh = energyWh / 1000;

      // Calculate cost so far
      const costSoFar = energyKwh * pricePerKwh;

      // Check if reserved amount is exhausted (stop at 98% to avoid overcharging, accounting for processing delay)
      const stopThreshold = transaction.walletReservedAmount * 0.98;
      if (costSoFar >= stopThreshold) {
        // Stop the transaction
        if (this.chargePointsService) {
          try {
            await this.chargePointsService.remoteStopTransaction(chargePointId, transactionId);
            this.logger.log(
              `Stopped wallet-based transaction ${transactionId} - Amount threshold reached. Energy: ${energyKwh.toFixed(2)} kWh, Cost: ${costSoFar.toFixed(2)} GHS, Reserved: ${transaction.walletReservedAmount} GHS`,
            );
          } catch (error) {
            this.logger.error(`Failed to stop transaction ${transactionId}:`, error);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error checking wallet-based transaction ${transactionId}:`, error);
    }
  }

  async createReservation(data: {
    chargePointId: string;
    reservationId: number;
    connectorId: number;
    idTag: string;
    parentIdTag?: string;
    expiryDate: string;
  }) {
    return this.reservationsService.createReservation(data);
  }

  async cancelReservation(chargePointId: string, reservationId: number) {
    return this.reservationsService.cancelReservation(chargePointId, reservationId);
  }

  async getLocalListVersion(chargePointId: string) {
    return this.localAuthListService.getLocalListVersion(chargePointId);
  }

  async sendLocalList(data: {
    chargePointId: string;
    listVersion: number;
    updateType: string;
    localAuthorizationList: any[];
  }) {
    return this.localAuthListService.sendLocalList({
      chargePointId: data.chargePointId,
      listVersion: data.listVersion,
      updateType: data.updateType as 'Full' | 'Differential',
      localAuthorizationList: data.localAuthorizationList,
    });
  }

  async handleDataTransfer(data: {
    chargePointId: string;
    vendorId: string;
    messageId?: string;
    data?: string;
  }) {
    // TODO: Implement DataTransferService if needed
    this.logger.log(`DataTransfer from ${data.chargePointId}, vendor: ${data.vendorId}`);
    return { status: 'Accepted' };
  }

  async logConnectionEvent(data: {
    chargePointId: string;
    eventType: string;
    status?: string;
    errorCode?: string;
    errorMessage?: string;
    closeCode?: number;
    closeReason?: string;
    ipAddress?: string;
    userAgent?: string;
    requestUrl?: string;
    vendorId?: number;
    metadata?: Record<string, any>;
  }) {
    return this.connectionLogsService.logEvent({
      ...data,
      eventType: data.eventType as ConnectionEventType,
      status: data.status as ConnectionStatus | undefined,
    });
  }

  async updateHeartbeat(chargePointId: string, timestamp?: string): Promise<void> {
    const chargePoint = await this.chargePointRepository.findOne({
      where: { chargePointId },
    });

    if (!chargePoint) {
      this.logger.warn(`Charge point ${chargePointId} not found for heartbeat update`);
      return;
    }

    chargePoint.lastHeartbeat = timestamp ? new Date(timestamp) : new Date();
    chargePoint.lastSeen = new Date();
    await this.chargePointRepository.save(chargePoint);

    // Broadcast heartbeat update
    if (this.websocketGateway) {
      try {
        this.websocketGateway.broadcastChargePointStatus({
          chargePointId: chargePoint.chargePointId,
          status: chargePoint.status,
          lastSeen: chargePoint.lastSeen,
          lastHeartbeat: chargePoint.lastHeartbeat,
        });
      } catch (error) {
        this.logger.error(`Error broadcasting heartbeat update:`, error);
      }
    }

    this.logger.debug(`Updated heartbeat for charge point ${chargePointId}`);
  }
}

