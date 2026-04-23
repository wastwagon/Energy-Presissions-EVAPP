import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ChargePoint } from '../entities/charge-point.entity';
import { Connector } from '../entities/connector.entity';
import { Transaction } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';
import { WalletService } from '../wallet/wallet.service';
import { BlockedChargePointId } from '../entities/blocked-charge-point-id.entity';
import { assertChargePointRegistrationAllowed } from '../common/charge-point-registration-block';

@Injectable()
export class ChargePointsService {
  private readonly logger = new Logger(ChargePointsService.name);
  private ocppGatewayUrl: string;

  constructor(
    @InjectRepository(ChargePoint)
    private chargePointRepository: Repository<ChargePoint>,
    @InjectRepository(Connector)
    private connectorRepository: Repository<Connector>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(BlockedChargePointId)
    private blockedChargePointIdRepository: Repository<BlockedChargePointId>,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
    private configService: ConfigService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    // Same host as API when OCPP is embedded (Render / single container). Override for split compose.
    this.ocppGatewayUrl =
      this.configService.get<string>('OCPP_GATEWAY_URL') ||
      `http://127.0.0.1:${process.env.PORT || 3000}`;
  }

  async findAll(search?: string, vendorId?: number): Promise<ChargePoint[]> {
    // Get all charge points with their active transaction status
    const queryBuilder = this.chargePointRepository.createQueryBuilder('cp');

    if (vendorId) {
      queryBuilder.where('cp.vendor_id = :vendorId', { vendorId });
    }

    if (search) {
      const searchCondition = vendorId
        ? '(cp.chargePointId ILIKE :search OR cp.vendorName ILIKE :search OR cp.model ILIKE :search OR cp.serialNumber ILIKE :search)'
        : '(cp.chargePointId ILIKE :search OR cp.vendorName ILIKE :search OR cp.model ILIKE :search OR cp.serialNumber ILIKE :search)';
      
      queryBuilder.andWhere(searchCondition, { search: `%${search}%` });
    }

    const chargePoints = await queryBuilder.orderBy('cp.createdAt', 'DESC').getMany();

    const cpIds = chargePoints.map((cp) => cp.chargePointId);
    const activeCountByCp = new Map<string, number>();
    if (cpIds.length > 0) {
      const rows = await this.transactionRepository
        .createQueryBuilder('t')
        .select('t.chargePointId', 'cpId')
        .addSelect('COUNT(*)', 'cnt')
        .where('t.status = :st', { st: 'Active' })
        .andWhere('t.chargePointId IN (:...cpIds)', { cpIds })
        .groupBy('t.chargePointId')
        .getRawMany<{ cpId: string; cnt: string }>();
      for (const r of rows) {
        const id = String(r.cpId ?? (r as { cpid?: string }).cpid ?? '');
        if (id) activeCountByCp.set(id, parseInt(String(r.cnt), 10) || 0);
      }
    }

    // Update status based on active transactions and connector status
    for (const cp of chargePoints) {
      const activeTransactions = activeCountByCp.get(cp.chargePointId) ?? 0;
      cp.activeTransactionCount = activeTransactions;

      if (activeTransactions > 0) {
        cp.status = 'Charging';
      } else {
        const connectors = await this.connectorRepository.find({
          where: { chargePointId: cp.chargePointId },
        });

        const hasChargingConnector = connectors.some((c) => c.status === 'Charging');
        if (hasChargingConnector) {
          cp.status = 'Charging';
        }
      }
    }

    return chargePoints;
  }

  async findOne(chargePointId: string): Promise<ChargePoint> {
    const chargePoint = await this.chargePointRepository.findOne({
      where: { chargePointId },
    });

    if (!chargePoint) {
      throw new NotFoundException(`Charge point ${chargePointId} not found`);
    }

    const activeTransactions = await this.transactionRepository.count({
      where: { chargePointId, status: 'Active' },
    });
    chargePoint.activeTransactionCount = activeTransactions;

    return chargePoint;
  }

  async create(data: Partial<ChargePoint>): Promise<ChargePoint> {
    if (typeof data.chargePointId === 'string' && data.chargePointId.trim().length > 0) {
      await assertChargePointRegistrationAllowed(
        data.chargePointId.trim(),
        this.blockedChargePointIdRepository,
        this.logger,
      );
    }
    const chargePoint = this.chargePointRepository.create(data);
    return this.chargePointRepository.save(chargePoint);
  }

  async update(chargePointId: string, data: Partial<ChargePoint>): Promise<ChargePoint> {
    const chargePoint = await this.findOne(chargePointId);
    Object.assign(chargePoint, data);
    return this.chargePointRepository.save(chargePoint);
  }

  /**
   * Remove a charge point and dependent rows (FK-safe). Blocks if an OCPP session is still Active.
   */
  async delete(chargePointId: string): Promise<void> {
    await this.findOne(chargePointId);
    const active = await this.transactionRepository.count({
      where: { chargePointId, status: 'Active' },
    });
    if (active > 0) {
      throw new BadRequestException(
        'This charge point has an active session. Stop charging before removing the device.',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const run = (sql: string, params: string[] = [chargePointId]) => manager.query(sql, params);

      await run(
        `DELETE FROM wallet_transactions wt WHERE wt.transaction_id IN (SELECT t.id FROM transactions t WHERE t.charge_point_id = $1)`,
      );
      await run(
        `DELETE FROM wallet_transactions wt WHERE wt.payment_id IN (
          SELECT p.id FROM payments p WHERE p.transaction_id IN (SELECT t.id FROM transactions t WHERE t.charge_point_id = $1)
        )`,
      );
      await run(
        `DELETE FROM payments p WHERE p.transaction_id IN (SELECT t.id FROM transactions t WHERE t.charge_point_id = $1)`,
      );
      await run(
        `DELETE FROM invoices i WHERE i.transaction_id IN (SELECT t.id FROM transactions t WHERE t.charge_point_id = $1)`,
      );
      await run(`DELETE FROM meter_samples WHERE charge_point_id = $1`);
      await run(
        `DELETE FROM meter_samples WHERE transaction_id IN (SELECT t.id FROM transactions t WHERE t.charge_point_id = $1)`,
      );
      await run(`DELETE FROM reservations WHERE charge_point_id = $1`);
      await run(`DELETE FROM firmware_jobs WHERE charge_point_id = $1`);
      await run(`DELETE FROM diagnostics_jobs WHERE charge_point_id = $1`);
      await run(`DELETE FROM charging_profiles WHERE charge_point_id = $1`);
      await run(`DELETE FROM pending_commands WHERE charge_point_id = $1`);
      await run(`DELETE FROM connection_logs WHERE charge_point_id = $1`);
      await run(`DELETE FROM connection_statistics WHERE charge_point_id = $1`);
      await run(`DELETE FROM local_auth_list WHERE charge_point_id = $1`);
      await run(`DELETE FROM local_auth_list_versions WHERE charge_point_id = $1`);
      await run(`DELETE FROM user_favorites WHERE charge_point_id = $1`);
      await run(`DELETE FROM config_keys WHERE charge_point_id = $1`);
      await run(`DELETE FROM transactions WHERE charge_point_id = $1`);
      await run(`DELETE FROM connectors WHERE charge_point_id = $1`);
      await run(`DELETE FROM charge_points WHERE charge_point_id = $1`);
      await run(
        `INSERT INTO blocked_charge_point_ids (charge_point_id, reason, blocked_at)
         VALUES ($1, 'admin_delete', NOW())
         ON CONFLICT (charge_point_id) DO UPDATE SET blocked_at = EXCLUDED.blocked_at, reason = EXCLUDED.reason`,
      );
    });

    this.logger.log(`Charge point ${chargePointId} deleted; OCPP re-registration blocked until Super Admin clears block`);
  }

  /**
   * Allow this charge point ID to register again (OCPP + REST create). Super Admin only at controller.
   */
  async removeRegistrationBlock(chargePointId: string): Promise<void> {
    const res = await this.blockedChargePointIdRepository.delete({ chargePointId });
    if (!res.affected) {
      throw new NotFoundException(`No registration block found for charge point ${chargePointId}`);
    }
    this.logger.log(`Registration block removed for ${chargePointId}`);
  }

  /**
   * When connectors or CP row show Charging/Preparing but there is no Active transaction,
   * reset stored connector + CP status so ops can delete or re-use the device.
   * Does not send OCPP RemoteStop (use remoteStopTransaction when a real session exists).
   */
  async clearStaleOperationalState(chargePointId: string): Promise<{
    clearedConnectors: number;
    chargePointStatus: string;
  }> {
    const cp = await this.findOne(chargePointId);
    const active = await this.transactionRepository.count({
      where: { chargePointId, status: 'Active' },
    });
    if (active > 0) {
      throw new BadRequestException(
        'This charge point has an active billing session. Use Remote Stop with the transaction ID, or end the session from Charging Sessions, before clearing state.',
      );
    }

    const staleConnectorStatuses = [
      'Charging',
      'Finishing',
      'SuspendedEVSE',
      'SuspendedEV',
      'Preparing',
    ];
    const connectors = await this.connectorRepository.find({
      where: { chargePointId },
    });

    let clearedConnectors = 0;
    for (const c of connectors) {
      if (staleConnectorStatuses.includes(c.status)) {
        c.status = 'Available';
        c.errorCode = null;
        c.vendorErrorCode = null;
        c.lastStatusUpdate = new Date();
        await this.connectorRepository.save(c);
        clearedConnectors += 1;
      }
    }

    const staleCpStatuses = ['Charging', 'Preparing', 'Finishing', 'SuspendedEVSE', 'SuspendedEV'];
    if (staleCpStatuses.includes(cp.status)) {
      cp.status = 'Available';
      await this.chargePointRepository.save(cp);
    }

    this.logger.warn(
      `clearStaleOperationalState: ${chargePointId} cleared ${clearedConnectors} connector(s); CP status now ${cp.status}`,
    );

    return { clearedConnectors, chargePointStatus: cp.status };
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

    const connector = await this.connectorRepository.findOne({
      where: { chargePointId, connectorId },
    });
    if (connector && !['Available', 'Preparing'].includes(connector.status)) {
      const activeCount = await this.transactionRepository.count({
        where: { chargePointId, connectorId, status: 'Active' },
      });
      if (
        activeCount === 0 &&
        ['Charging', 'Finishing'].includes(connector.status)
      ) {
        this.logger.warn(
          `Healing connector ${chargePointId}/${connectorId} from ${connector.status} to Available (no active transaction)`,
        );
        connector.status = 'Available';
        connector.errorCode = null;
        connector.vendorErrorCode = null;
        await this.connectorRepository.save(connector);
      }
    }
    if (connector) {
      const startable = ['Available', 'Preparing'];
      if (!startable.includes(connector.status)) {
        const hint = connector.errorCode ? ` (${connector.errorCode})` : '';
        throw new BadRequestException(
          `Connector ${connectorId} is ${connector.status}${hint}. Remote start is only offered when the connector is Available or Preparing.`,
        );
      }
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

  /**
   * Start wallet-based charging transaction
   * Reserves amount from wallet and starts charging session
   */
  async startWalletBasedCharging(
    chargePointId: string,
    connectorId: number,
    userId: number,
    amount: number,
  ): Promise<{ success: boolean; transactionId?: number; message: string }> {
    // Verify charge point exists
    await this.findOne(chargePointId);

    if (connectorId === 0) {
      throw new BadRequestException('Connector ID 0 is not valid for transactions');
    }

    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Check wallet balance
    const hasBalance = await this.walletService.hasSufficientBalance(userId, amount);
    if (!hasBalance) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // Reserve amount from wallet (create a pending transaction)
    // We'll deduct it when the transaction actually starts
    const idTag = `USER_${userId}`;
    
    // Reserve the amount from wallet FIRST (before starting transaction)
    // This ensures the reservation exists when the transaction is created
    const walletReservation = await this.walletService.reserve(
      userId,
      amount,
      `Charging session at ${chargePointId} - Reserved amount`,
      undefined, // transactionId will be set later
    );

    // Start the remote transaction
    const startResult = await this.remoteStartTransaction(chargePointId, connectorId, idTag);
    
    if (!startResult.success) {
      // If remote start failed, cancel the reservation
      try {
        await this.walletService.cancelReservation(walletReservation.id);
      } catch (error) {
        this.logger.error(`Failed to cancel reservation after remote start failure:`, error);
      }
      throw new BadRequestException('Failed to start charging session');
    }

    // Find the active transaction that was just created (with retry logic)
    // The transaction is created asynchronously when the device sends StartTransaction
    let activeTransaction = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      activeTransaction = await this.transactionRepository.findOne({
        where: {
          chargePointId,
          connectorId,
          idTag,
          status: 'Active',
        },
        order: { startTime: 'DESC' },
      });

      if (activeTransaction) {
        break;
      }

      // Wait a bit before retrying (transaction creation is async)
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (activeTransaction) {
      // Store the reserved amount in the transaction
      activeTransaction.walletReservedAmount = amount;
      await this.transactionRepository.save(activeTransaction);

      // Link the reservation to this transaction
      // Note: walletReservation is already saved, we need to update it via walletService
      // The reservation will be linked automatically when the transaction is created
      // via the check in createTransaction method
      
      return {
        success: true,
        transactionId: activeTransaction.transactionId,
        message: `Charging started. Amount ${amount} GHS reserved. Session will stop automatically when amount is exhausted.`,
      };
    }

    // If transaction not found after retries, the reservation will be linked later
    // when createTransaction checks for pending reservations
    this.logger.warn(`Transaction not found after wallet-start for ${chargePointId}, reservation ${walletReservation.id} will be linked when transaction is created`);

    return {
      success: true,
      message: 'Charging session started. Amount will be reserved when transaction begins.',
    };
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
    
    // Update transaction status if stop was successful
    if (success) {
      const transaction = await this.transactionRepository.findOne({
        where: { transactionId },
      });
      if (transaction && transaction.status === 'Active') {
        this.logger.log(`Stopping transaction ${transactionId} at ${chargePointId}. Waiting for device StopTransaction response.`);
        
        // If device doesn't respond within 15 seconds, complete transaction manually using latest meter values
        setTimeout(async () => {
          const stillActive = await this.transactionRepository.findOne({
            where: { transactionId },
          });
          
          if (stillActive && stillActive.status === 'Active') {
            this.logger.warn(`Transaction ${transactionId} still active after remote stop timeout. Completing manually.`);
            
            // Get latest meter value
            const latestMeterResult = await this.transactionRepository.manager
              .createQueryBuilder()
              .select('MAX(ms.value)', 'maxValue')
              .from('meter_samples', 'ms')
              .where('ms.transaction_id = :txId', { txId: transactionId })
              .andWhere('ms.measurand = :measurand', { measurand: 'Energy.Active.Import.Register' })
              .getRawOne();
            
            const meterStop = latestMeterResult?.maxValue || transaction.meterStart;
            
            // Call internal service to complete transaction
            try {
              const internalServiceUrl = process.env.CSMS_API_URL || 'http://csms-api:3000';
              await axios.post(
                `${internalServiceUrl}/api/internal/transactions/${transactionId}/stop`,
                {
                  meterStop: meterStop,
                  stopTime: new Date().toISOString(),
                  reason: 'Remote',
                },
                {
                  headers: {
                    'Authorization': `Bearer ${process.env.SERVICE_TOKEN || ''}`,
                    'Content-Type': 'application/json',
                  },
                }
              );
              this.logger.log(`Manually completed transaction ${transactionId} after timeout`);
            } catch (error: any) {
              this.logger.error(`Failed to manually complete transaction ${transactionId}:`, error?.message || error);
            }
          }
        }, 15000); // 15 second timeout
      }
    }
    
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

