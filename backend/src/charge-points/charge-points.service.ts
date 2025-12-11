import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChargePoint } from '../entities/charge-point.entity';
import { Connector } from '../entities/connector.entity';
import { Transaction } from '../entities/transaction.entity';

@Injectable()
export class ChargePointsService {
  private ocppGatewayUrl: string;

  constructor(
    @InjectRepository(ChargePoint)
    private chargePointRepository: Repository<ChargePoint>,
    @InjectRepository(Connector)
    private connectorRepository: Repository<Connector>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private configService: ConfigService,
  ) {
    // OCPP Gateway URL - use internal Docker network URL
    this.ocppGatewayUrl = process.env.OCPP_GATEWAY_URL || 'http://ocpp-gateway:9000';
  }

  async findAll(search?: string): Promise<ChargePoint[]> {
    const queryBuilder = this.chargePointRepository.createQueryBuilder('cp');

    if (search) {
      queryBuilder.where(
        '(cp.chargePointId ILIKE :search OR cp.vendor ILIKE :search OR cp.model ILIKE :search OR cp.serialNumber ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return queryBuilder.orderBy('cp.createdAt', 'DESC').getMany();
  }

  async findOne(chargePointId: string): Promise<ChargePoint> {
    const chargePoint = await this.chargePointRepository.findOne({
      where: { chargePointId },
    });

    if (!chargePoint) {
      throw new NotFoundException(`Charge point ${chargePointId} not found`);
    }

    return chargePoint;
  }

  async create(data: Partial<ChargePoint>): Promise<ChargePoint> {
    const chargePoint = this.chargePointRepository.create(data);
    return this.chargePointRepository.save(chargePoint);
  }

  async update(chargePointId: string, data: Partial<ChargePoint>): Promise<ChargePoint> {
    const chargePoint = await this.findOne(chargePointId);
    Object.assign(chargePoint, data);
    return this.chargePointRepository.save(chargePoint);
  }

  async delete(chargePointId: string): Promise<void> {
    const chargePoint = await this.findOne(chargePointId);
    await this.chargePointRepository.remove(chargePoint);
  }

  async getStatus(chargePointId: string): Promise<any> {
    const chargePoint = await this.findOne(chargePointId);
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
        lastStatusUpdate: c.lastStatusUpdate,
      })),
      activeTransactions,
    };
  }

  async getConnectors(chargePointId: string): Promise<Connector[]> {
    await this.findOne(chargePointId); // Verify charge point exists
    return this.connectorRepository.find({
      where: { chargePointId },
      order: { connectorId: 'ASC' },
    });
  }

  async getConnector(
    chargePointId: string,
    connectorId: number,
  ): Promise<Connector> {
    const connector = await this.connectorRepository.findOne({
      where: { chargePointId, connectorId },
    });

    if (!connector) {
      throw new NotFoundException(
        `Connector ${connectorId} not found for charge point ${chargePointId}`,
      );
    }

    return connector;
  }

  private async sendOCPPCommand(chargePointId: string, message: any): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.ocppGatewayUrl}/command/${chargePointId}`,
        { message },
        { timeout: 5000 }
      );
      return response.data.success === true;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 503) {
        throw new BadRequestException('Charge point is not connected');
      }
      throw new BadRequestException(`Failed to send command: ${error.message}`);
    }
  }

  async remoteStartTransaction(
    chargePointId: string,
    connectorId: number,
    idTag: string,
  ): Promise<{ success: boolean }> {
    await this.findOne(chargePointId); // Verify charge point exists

    if (connectorId === 0) {
      throw new BadRequestException('Connector ID 0 is not valid for transactions');
    }

    const messageId = `remote-start-${Date.now()}`;
    const message = [
      2, // CALL
      messageId,
      'RemoteStartTransaction',
      {
        connectorId,
        idTag,
      },
    ];

    const success = await this.sendOCPPCommand(chargePointId, message);
    return { success };
  }

  async remoteStopTransaction(
    chargePointId: string,
    transactionId: number,
  ): Promise<{ success: boolean }> {
    await this.findOne(chargePointId); // Verify charge point exists

    const messageId = `remote-stop-${Date.now()}`;
    const message = [
      2, // CALL
      messageId,
      'RemoteStopTransaction',
      {
        transactionId,
      },
    ];

    const success = await this.sendOCPPCommand(chargePointId, message);
    return { success };
  }

  async unlockConnector(
    chargePointId: string,
    connectorId: number,
  ): Promise<{ success: boolean }> {
    await this.findOne(chargePointId); // Verify charge point exists

    const messageId = `unlock-${Date.now()}`;
    const message = [
      2, // CALL
      messageId,
      'UnlockConnector',
      {
        connectorId,
      },
    ];

    const success = await this.sendOCPPCommand(chargePointId, message);
    return { success };
  }

  async changeAvailability(
    chargePointId: string,
    connectorId: number,
    type: 'Inoperative' | 'Operative',
  ): Promise<{ success: boolean }> {
    await this.findOne(chargePointId); // Verify charge point exists

    const messageId = `change-availability-${Date.now()}`;
    const message = [
      2, // CALL
      messageId,
      'ChangeAvailability',
      {
        connectorId,
        type,
      },
    ];

    const success = await this.sendOCPPCommand(chargePointId, message);
    return { success };
  }

  async getConfiguration(chargePointId: string, keys?: string[]): Promise<any> {
    await this.findOne(chargePointId); // Verify charge point exists

    const messageId = `get-config-${Date.now()}`;
    const message = [
      2, // CALL
      messageId,
      'GetConfiguration',
      keys ? { key: keys } : {},
    ];

    const result = await this.sendOCPPCommandWithResponse(chargePointId, message);
    return result;
  }

  async changeConfiguration(
    chargePointId: string,
    key: string,
    value: string,
  ): Promise<any> {
    await this.findOne(chargePointId); // Verify charge point exists

    const messageId = `change-config-${Date.now()}`;
    const message = [
      2, // CALL
      messageId,
      'ChangeConfiguration',
      {
        key,
        value,
      },
    ];

    const result = await this.sendOCPPCommandWithResponse(chargePointId, message);
    return result;
  }

  private async sendOCPPCommandWithResponse(
    chargePointId: string,
    message: any,
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${this.ocppGatewayUrl}/command/${chargePointId}`,
        { message },
        { timeout: 35000 } // Slightly longer timeout for commands with responses
      );
      
      if (response.data.success) {
        return response.data.response || {};
      } else {
        throw new BadRequestException(response.data.error || 'Command failed');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 503) {
          throw new BadRequestException('Charge point is not connected');
        }
        if (error.response?.status === 504) {
          throw new BadRequestException('Command timeout - charge point did not respond');
        }
      }
      throw new BadRequestException(`Failed to send command: ${error.message}`);
    }
  }

  /**
   * Reset charge point
   */
  async reset(chargePointId: string, type: 'Hard' | 'Soft'): Promise<any> {
    await this.findOne(chargePointId);

    const messageId = `reset-${Date.now()}`;
    const message = [
      2, // CALL
      messageId,
      'Reset',
      { type },
    ];

    return this.sendOCPPCommandWithResponse(chargePointId, message);
  }

  /**
   * Clear authorization cache
   */
  async clearCache(chargePointId: string): Promise<any> {
    await this.findOne(chargePointId);

    const messageId = `clear-cache-${Date.now()}`;
    const message = [
      2, // CALL
      messageId,
      'ClearCache',
      {},
    ];

    return this.sendOCPPCommandWithResponse(chargePointId, message);
  }

  /**
   * Reserve connector
   */
  async reserveNow(
    chargePointId: string,
    connectorId: number,
    expiryDate: string,
    idTag: string,
    reservationId: number,
    parentIdTag?: string,
  ): Promise<any> {
    await this.findOne(chargePointId);

    const messageId = `reserve-now-${Date.now()}`;
    const message = [
      2, // CALL
      messageId,
      'ReserveNow',
      {
        connectorId,
        expiryDate,
        idTag,
        reservationId,
        parentIdTag,
      },
    ];

    return this.sendOCPPCommandWithResponse(chargePointId, message);
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(chargePointId: string, reservationId: number): Promise<any> {
    await this.findOne(chargePointId);

    const messageId = `cancel-reservation-${Date.now()}`;
    const message = [
      2, // CALL
      messageId,
      'CancelReservation',
      { reservationId },
    ];

    return this.sendOCPPCommandWithResponse(chargePointId, message);
  }

  /**
   * Send local authorization list
   */
  async sendLocalList(
    chargePointId: string,
    listVersion: number,
    updateType: 'Full' | 'Differential',
    localAuthorizationList?: any[],
  ): Promise<any> {
    await this.findOne(chargePointId);

    const messageId = `send-local-list-${Date.now()}`;
    const message = [
      2, // CALL
      messageId,
      'SendLocalList',
      {
        listVersion,
        updateType,
        localAuthorizationList: localAuthorizationList || [],
      },
    ];

    return this.sendOCPPCommandWithResponse(chargePointId, message);
  }

  /**
   * Get local list version
   */
  async getLocalListVersion(chargePointId: string): Promise<any> {
    await this.findOne(chargePointId);

    const messageId = `get-local-list-version-${Date.now()}`;
    const message = [
      2, // CALL
      messageId,
      'GetLocalListVersion',
      {},
    ];

    return this.sendOCPPCommandWithResponse(chargePointId, message);
  }

  /**
   * Set charging profile
   */
  async setChargingProfile(chargePointId: string, connectorId: number, chargingProfile: any): Promise<any> {
    await this.findOne(chargePointId);

    const messageId = `set-charging-profile-${Date.now()}`;
    const message = [
      2, // CALL
      messageId,
      'SetChargingProfile',
      {
        connectorId,
        chargingProfile,
      },
    ];

    return this.sendOCPPCommandWithResponse(chargePointId, message);
  }

  /**
   * Clear charging profile
   */
  async clearChargingProfile(
    chargePointId: string,
    id?: number,
    connectorId?: number,
    chargingProfilePurpose?: string,
    stackLevel?: number,
  ): Promise<any> {
    await this.findOne(chargePointId);

    const messageId = `clear-charging-profile-${Date.now()}`;
    const message = [
      2, // CALL
      messageId,
      'ClearChargingProfile',
      {
        id,
        connectorId,
        chargingProfilePurpose,
        stackLevel,
      },
    ];

    return this.sendOCPPCommandWithResponse(chargePointId, message);
  }

  /**
   * Get composite schedule
   */
  async getCompositeSchedule(
    chargePointId: string,
    connectorId: number,
    duration: number,
    chargingRateUnit?: 'A' | 'W',
  ): Promise<any> {
    await this.findOne(chargePointId);

    const messageId = `get-composite-schedule-${Date.now()}`;
    const message = [
      2, // CALL
      messageId,
      'GetCompositeSchedule',
      {
        connectorId,
        duration,
        chargingRateUnit,
      },
    ];

    return this.sendOCPPCommandWithResponse(chargePointId, message);
  }

  /**
   * Update firmware
   */
  async updateFirmware(
    chargePointId: string,
    location: string,
    retrieveDate: string,
    retryInterval?: number,
    retries?: number,
  ): Promise<any> {
    await this.findOne(chargePointId);

    const messageId = `update-firmware-${Date.now()}`;
    const message = [
      2, // CALL
      messageId,
      'UpdateFirmware',
      {
        location,
        retrieveDate,
        retryInterval,
        retries,
      },
    ];

    return this.sendOCPPCommandWithResponse(chargePointId, message);
  }

  /**
   * Get diagnostics
   */
  async getDiagnostics(
    chargePointId: string,
    location: string,
    startTime?: string,
    stopTime?: string,
    retryInterval?: number,
    retries?: number,
  ): Promise<any> {
    await this.findOne(chargePointId);

    const messageId = `get-diagnostics-${Date.now()}`;
    const message = [
      2, // CALL
      messageId,
      'GetDiagnostics',
      {
        location,
        startTime,
        stopTime,
        retryInterval,
        retries,
      },
    ];

    return this.sendOCPPCommandWithResponse(chargePointId, message);
  }

  /**
   * Data transfer
   */
  async dataTransfer(
    chargePointId: string,
    vendorId: string,
    messageId?: string,
    data?: string,
  ): Promise<any> {
    await this.findOne(chargePointId);

    const messageId_ocpp = `data-transfer-${Date.now()}`;
    const message = [
      2, // CALL
      messageId_ocpp,
      'DataTransfer',
      {
        vendorId,
        messageId,
        data,
      },
    ];

    return this.sendOCPPCommandWithResponse(chargePointId, message);
  }
}

