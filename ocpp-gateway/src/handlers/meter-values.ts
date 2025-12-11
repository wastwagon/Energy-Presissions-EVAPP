import { ConnectionManager } from '../services/connection-manager';
import { logger } from '../utils/logger';
import { MeterValuesPayload, OCPPMessage } from '../types/ocpp-message';
import axios from 'axios';

export class MeterValuesHandler {
  constructor(private connectionManager: ConnectionManager) {}

  async handle(chargePointId: string, messageId: string, payload: MeterValuesPayload): Promise<void> {
    logger.debug(`Processing MeterValues from ${chargePointId}`, {
      connectorId: payload.connectorId,
      transactionId: payload.transactionId,
      meterValueCount: payload.meterValue?.length || 0
    });

    try {
      // Store meter values in CSMS API
      await this.storeMeterValues(chargePointId, payload);

      // Send empty response
      const ocppResponse: OCPPMessage = [
        3, // CALLRESULT
        messageId,
        {} as any
      ];

      this.connectionManager.sendMessage(chargePointId, ocppResponse);
    } catch (error) {
      logger.error(`Error processing MeterValues from ${chargePointId}:`, error);
      // Still send empty response (MeterValues is fire-and-forget)
      const ocppResponse: OCPPMessage = [
        3, // CALLRESULT
        messageId,
        {} as any
      ];
      this.connectionManager.sendMessage(chargePointId, ocppResponse);
    }
  }

  private async storeMeterValues(chargePointId: string, payload: MeterValuesPayload): Promise<void> {
    const csmsApiUrl = process.env.CSMS_API_URL || 'http://csms-api:3000';
    
    try {
      await axios.post(`${csmsApiUrl}/api/internal/meter-values`, {
        chargePointId,
        connectorId: payload.connectorId,
        transactionId: payload.transactionId,
        meterValues: payload.meterValue
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      logger.error(`Failed to store meter values for ${chargePointId}:`, error);
      // Don't throw - MeterValues is fire-and-forget
    }
  }
}

