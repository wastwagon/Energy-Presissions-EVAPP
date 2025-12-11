import { ConnectionManager } from '../services/connection-manager';
import { logger } from '../utils/logger';
import { BootNotificationPayload, BootNotificationResponse, OCPPMessage } from '../types/ocpp-message';
import axios from 'axios';

export class BootNotificationHandler {
  constructor(private connectionManager: ConnectionManager) {}

  async handle(chargePointId: string, messageId: string, payload: BootNotificationPayload): Promise<void> {
    logger.info(`Processing BootNotification from ${chargePointId}`, payload);

    try {
      // Notify CSMS API about charge point registration
      await this.notifyCSMS(chargePointId, payload);

      // Send response
      const response: BootNotificationResponse = {
        status: 'Accepted',
        currentTime: new Date().toISOString(),
        interval: 300 // Default heartbeat interval: 5 minutes
      };

      const ocppResponse: OCPPMessage = [
        3, // CALLRESULT
        messageId,
        response as any
      ];

      this.connectionManager.sendMessage(chargePointId, ocppResponse);
      logger.info(`BootNotification accepted for ${chargePointId}`);
    } catch (error) {
      logger.error(`Error processing BootNotification from ${chargePointId}:`, error);
      
      // Send rejection
      const response: BootNotificationResponse = {
        status: 'Rejected',
        currentTime: new Date().toISOString()
      };

      const ocppResponse: OCPPMessage = [
        3, // CALLRESULT
        messageId,
        response as any
      ];

      this.connectionManager.sendMessage(chargePointId, ocppResponse);
    }
  }

  private async notifyCSMS(chargePointId: string, payload: BootNotificationPayload): Promise<void> {
    const csmsApiUrl = process.env.CSMS_API_URL || 'http://csms-api:3000';
    
    try {
      await axios.post(`${csmsApiUrl}/api/internal/charge-points`, {
        chargePointId,
        vendor: payload.chargePointVendor,
        model: payload.chargePointModel,
        serialNumber: payload.chargePointSerialNumber,
        firmwareVersion: payload.firmwareVersion,
        iccid: payload.iccid,
        imsi: payload.imsi
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      logger.error(`Failed to notify CSMS API about charge point ${chargePointId}:`, error);
      throw error;
    }
  }
}

