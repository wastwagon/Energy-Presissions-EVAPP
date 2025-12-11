import { ConnectionManager } from '../services/connection-manager';
import { logger } from '../utils/logger';
import { StatusNotificationPayload, OCPPMessage } from '../types/ocpp-message';
import axios from 'axios';

export class StatusNotificationHandler {
  constructor(private connectionManager: ConnectionManager) {}

  async handle(chargePointId: string, messageId: string, payload: StatusNotificationPayload): Promise<void> {
    logger.info(`Processing StatusNotification from ${chargePointId}`, {
      connectorId: payload.connectorId,
      status: payload.status,
      errorCode: payload.errorCode
    });

    try {
      // Notify CSMS API about status change
      await this.notifyCSMS(chargePointId, payload);

      // Send empty response (StatusNotification doesn't require payload)
      const ocppResponse: OCPPMessage = [
        3, // CALLRESULT
        messageId,
        {} as any
      ];

      this.connectionManager.sendMessage(chargePointId, ocppResponse);
    } catch (error) {
      logger.error(`Error processing StatusNotification from ${chargePointId}:`, error);
      // Still send empty response (StatusNotification is fire-and-forget)
      const ocppResponse: OCPPMessage = [
        3, // CALLRESULT
        messageId,
        {} as any
      ];
      this.connectionManager.sendMessage(chargePointId, ocppResponse);
    }
  }

  private async notifyCSMS(chargePointId: string, payload: StatusNotificationPayload): Promise<void> {
    const csmsApiUrl = process.env.CSMS_API_URL || 'http://csms-api:3000';
    
    try {
      await axios.post(`${csmsApiUrl}/api/internal/charge-points/${chargePointId}/status`, {
        connectorId: payload.connectorId,
        status: payload.status,
        errorCode: payload.errorCode,
        vendorErrorCode: payload.vendorErrorCode,
        timestamp: payload.timestamp || new Date().toISOString()
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      logger.error(`Failed to notify CSMS API about status change for ${chargePointId}:`, error);
      // Don't throw - StatusNotification is fire-and-forget
    }
  }
}

