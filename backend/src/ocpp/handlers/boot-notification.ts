import { ConnectionManager } from '../services/connection-manager';
import { logger } from '../utils/logger';
import { BootNotificationPayload, BootNotificationResponse, OCPPMessage } from '../types/ocpp-message';
import axios from 'axios';

export class BootNotificationHandler {
  constructor(private connectionManager: ConnectionManager) {}

  async handle(chargePointId: string, messageId: string, payload: BootNotificationPayload, ws?: any): Promise<void> {
    // If chargePointId is temporary (starts with "temp_"), extract actual ID from BootNotification
    let actualChargePointId = chargePointId;
    
    if (chargePointId.startsWith('temp_') && payload.chargePointSerialNumber) {
      // Use serial number as charge point ID (this matches the Charge ID from device config)
      actualChargePointId = payload.chargePointSerialNumber;
      logger.info(`Mapping temporary connection ${chargePointId} to charge point ID: ${actualChargePointId}`);
      
      // Map the WebSocket connection to the actual charge point ID
      if (ws) {
        const mapped = this.connectionManager.mapConnectionToChargePointId(ws, actualChargePointId);
        if (!mapped) {
          logger.error(`Failed to map connection from ${chargePointId} to ${actualChargePointId}`);
          // Continue with original ID but log warning
        }
      }
    }

    logger.info(`Processing BootNotification from ${actualChargePointId}`, payload);
    logger.info(`BootNotification Details:`, {
      chargePointId: actualChargePointId,
      originalChargePointId: chargePointId,
      vendor: payload.chargePointVendor,
      model: payload.chargePointModel,
      serialNumber: payload.chargePointSerialNumber,
      firmwareVersion: payload.firmwareVersion,
      iccid: payload.iccid,
      imsi: payload.imsi,
    });

    try {
      // Notify CSMS API about charge point registration
      await this.notifyCSMS(actualChargePointId, payload);

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

      this.connectionManager.sendMessage(actualChargePointId, ocppResponse);
      logger.info(`BootNotification accepted for ${actualChargePointId}`);
    } catch (error) {
      logger.error(`Error processing BootNotification from ${actualChargePointId}:`, error);
      
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

      this.connectionManager.sendMessage(actualChargePointId, ocppResponse);
    }
  }

  private async notifyCSMS(chargePointId: string, payload: BootNotificationPayload): Promise<void> {
    const csmsApiUrl = process.env.CSMS_API_URL || 'http://csms-api:3000';
    
    const dataToSend = {
      chargePointId,
      vendor: payload.chargePointVendor,
      model: payload.chargePointModel,
      serialNumber: payload.chargePointSerialNumber,
      firmwareVersion: payload.firmwareVersion,
      iccid: payload.iccid,
      imsi: payload.imsi
    };
    
    logger.info(`Sending BootNotification data to CSMS API:`, dataToSend);
    
    try {
      await axios.post(`${csmsApiUrl}/api/internal/charge-points`, dataToSend, {
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

