import { ConnectionManager } from '../services/connection-manager';
import { logger } from '../utils/logger';
import { StopTransactionPayload, StopTransactionResponse, OCPPMessage } from '../types/ocpp-message';
import axios from 'axios';

export class StopTransactionHandler {
  constructor(private connectionManager: ConnectionManager) {}

  async handle(chargePointId: string, messageId: string, payload: StopTransactionPayload): Promise<void> {
    logger.info(`Processing StopTransaction from ${chargePointId}`, {
      transactionId: payload.transactionId,
      meterStop: payload.meterStop,
      reason: payload.reason
    });

    try {
      // Finalize transaction in CSMS API
      const idTagInfo = await this.finalizeTransaction(chargePointId, payload);

      // Send response
      const response: StopTransactionResponse = {
        idTagInfo
      };

      const ocppResponse: OCPPMessage = [
        3, // CALLRESULT
        messageId,
        response as any
      ];

      this.connectionManager.sendMessage(chargePointId, ocppResponse);
      logger.info(`StopTransaction response sent for ${chargePointId}, TransactionId: ${payload.transactionId}`);
    } catch (error) {
      logger.error(`Error processing StopTransaction from ${chargePointId}:`, error);
      
      // Send response anyway (StopTransaction should always succeed)
      const response: StopTransactionResponse = {};

      const ocppResponse: OCPPMessage = [
        3, // CALLRESULT
        messageId,
        response as any
      ];

      this.connectionManager.sendMessage(chargePointId, ocppResponse);
    }
  }

  private async finalizeTransaction(chargePointId: string, payload: StopTransactionPayload): Promise<any> {
    const csmsApiUrl = process.env.CSMS_API_URL || 'http://csms-api:3000';
    
    try {
      const response = await axios.post(`${csmsApiUrl}/api/internal/transactions/${payload.transactionId}/stop`, {
        meterStop: payload.meterStop,
        stopTime: payload.timestamp,
        reason: payload.reason,
        transactionData: payload.transactionData
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.idTagInfo || {};
    } catch (error) {
      logger.error(`Failed to finalize transaction ${payload.transactionId}:`, error);
      return {};
    }
  }
}

