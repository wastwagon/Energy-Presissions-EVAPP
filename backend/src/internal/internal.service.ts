import { Injectable, Logger } from '@nestjs/common';
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
import { ConnectionEventType, ConnectionStatus } from '../entities/connection-log.entity';

@Injectable()
export class InternalService {
  private readonly logger = new Logger(InternalService.name);
  private commandQueueService: any;
  private websocketGateway: any;

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
    private billingService: BillingService,
    private reservationsService: ReservationsService,
    private localAuthListService: LocalAuthListService,
    private vendorsService: VendorsService,
    private connectionLogsService: ConnectionLogsService,
  ) {}

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
        vendor: data.vendor || chargePoint.vendor,
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
        vendor: data.vendor,
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

    return {
      id: chargePoint.id,
      chargePointId: chargePoint.chargePointId,
      vendorId: chargePoint.vendorId || 1, // Default to vendor 1 if not set
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

    const transaction = this.transactionRepository.create({
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

    // Broadcast transaction started
    if (this.websocketGateway) {
      try {
        this.websocketGateway.broadcastTransactionStarted({
          transactionId: saved.transactionId,
          chargePointId: saved.chargePointId,
          connectorId: saved.connectorId,
          idTag: saved.idTag,
          startTime: saved.startTime,
        });
      } catch (error) {
        this.logger.error(`Error broadcasting transaction started:`, error);
      }
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

    // Calculate cost based on tariff
    try {
      const { totalCost } = await this.billingService.calculateCost(
        energyKwh,
        durationMinutes,
        startTime,
        transaction.currency,
      );
      transaction.totalCost = totalCost;
    } catch (error) {
      // If tariff not found, set cost to 0 and log error
      console.error(`Failed to calculate cost for transaction ${transactionId}:`, error);
      transaction.totalCost = 0;
    }

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Broadcast transaction stopped
    if (this.websocketGateway) {
      try {
        this.websocketGateway.broadcastTransactionStopped({
          transactionId: savedTransaction.transactionId,
          chargePointId: savedTransaction.chargePointId,
          totalEnergyKwh: savedTransaction.totalEnergyKwh,
          totalCost: savedTransaction.totalCost,
          stopTime: savedTransaction.stopTime!,
        });
      } catch (error) {
        this.logger.error(`Error broadcasting transaction stopped:`, error);
      }
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
}

