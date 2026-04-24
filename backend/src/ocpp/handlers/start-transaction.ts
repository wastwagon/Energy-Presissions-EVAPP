import { ConnectionManager } from '../services/connection-manager';
import { logger } from '../utils/logger';
import { StartTransactionPayload, StartTransactionResponse, IdTagInfo, OCPPMessage } from '../types/ocpp-message';
import axios from 'axios';

export class StartTransactionHandler {
  constructor(private connectionManager: ConnectionManager) {}

  private toOcppIdTagStatus(rawStatus: unknown): IdTagInfo['status'] {
    switch (String(rawStatus || '').toLowerCase()) {
      case 'accepted':
      case 'active':
        return 'Accepted';
      case 'blocked':
        return 'Blocked';
      case 'expired':
        return 'Expired';
      case 'concurrenttx':
        return 'ConcurrentTx';
      case 'invalid':
      default:
        return 'Invalid';
    }
  }

  async handle(chargePointId: string, messageId: string, payload: StartTransactionPayload): Promise<void> {
    logger.info(`Processing StartTransaction from ${chargePointId}`, {
      connectorId: payload.connectorId,
      idTag: payload.idTag,
      meterStart: payload.meterStart
    });

    // Validate connector ID (must not be 0)
    if (payload.connectorId === 0) {
      logger.warn(`Invalid connector ID 0 for transaction from ${chargePointId}`);
      // Still process, but log warning
    }

    try {
      const idTagInfo = await this.validateIdTag(payload.idTag);
      if (idTagInfo.status !== 'Accepted') {
        const rejectedResponse: StartTransactionResponse = {
          transactionId: 0,
          idTagInfo,
        };
        const rejectedMessage: OCPPMessage = [3, messageId, rejectedResponse as any];
        this.connectionManager.sendMessage(chargePointId, rejectedMessage);
        logger.warn(
          `StartTransaction rejected for ${chargePointId} idTag=${payload.idTag} status=${idTagInfo.status}`,
        );
        return;
      }

      // Create transaction in CSMS API
      const transactionId = await this.createTransaction(chargePointId, payload);

      // Send response
      const response: StartTransactionResponse = {
        transactionId,
        idTagInfo
      };

      const ocppResponse: OCPPMessage = [
        3, // CALLRESULT
        messageId,
        response as any
      ];

      this.connectionManager.sendMessage(chargePointId, ocppResponse);
      logger.info(`StartTransaction response sent for ${chargePointId}, TransactionId: ${transactionId}`);
    } catch (error) {
      logger.error(`Error processing StartTransaction from ${chargePointId}:`, error);
      
      // Send error response
      const idTagInfo: IdTagInfo = {
        status: 'Invalid'
      };

      const response: StartTransactionResponse = {
        transactionId: 0, // Invalid transaction ID
        idTagInfo
      };

      const ocppResponse: OCPPMessage = [
        3, // CALLRESULT
        messageId,
        response as any
      ];

      this.connectionManager.sendMessage(chargePointId, ocppResponse);
    }
  }

  private async validateIdTag(idTag: string): Promise<IdTagInfo> {
    const csmsApiUrl = process.env.CSMS_API_URL || 'http://csms-api:3000';

    try {
      const token = process.env.SERVICE_TOKEN || '';
      const response = await axios.get(`${csmsApiUrl}/api/internal/authorize/${idTag}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = (response.data || {}) as {
        status?: unknown;
        expiryDate?: unknown;
        parentIdTag?: unknown;
      };
      return {
        status: this.toOcppIdTagStatus(data.status),
        expiryDate: typeof data.expiryDate === 'string' ? data.expiryDate : undefined,
        parentIdTag: typeof data.parentIdTag === 'string' ? data.parentIdTag : undefined,
      };
    } catch (error) {
      logger.error(`Failed to validate IdTag ${idTag} before StartTransaction:`, error);
      return { status: 'Invalid' };
    }
  }

  private async createTransaction(chargePointId: string, payload: StartTransactionPayload): Promise<number> {
    const csmsApiUrl = process.env.CSMS_API_URL || 'http://csms-api:3000';
    
    try {
      const response = await axios.post(`${csmsApiUrl}/api/internal/transactions`, {
        chargePointId,
        connectorId: payload.connectorId,
        idTag: payload.idTag,
        meterStart: payload.meterStart,
        startTime: payload.timestamp,
        reservationId: payload.reservationId
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.transactionId;
    } catch (error: any) {
      // Extract useful error information without circular references
      const errorMessage = error?.message || 'Unknown error';
      const errorStatus = error?.response?.status;
      const errorData = error?.response?.data;
      
      logger.error(`Failed to create transaction for ${chargePointId}:`, {
        message: errorMessage,
        status: errorStatus,
        data: errorData,
        stack: error?.stack
      });
      throw error;
    }
  }
}

