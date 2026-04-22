import { ConnectionManager } from '../services/connection-manager';
import { logger } from '../utils/logger';
import { HeartbeatResponse, OCPPMessage } from '../types/ocpp-message';
import axios from 'axios';

export class HeartbeatHandler {
  constructor(private connectionManager: ConnectionManager) {}

  async handle(chargePointId: string, messageId: string, _payload: unknown): Promise<void> {
    logger.debug(`Processing Heartbeat from ${chargePointId}`);

    // Update last heartbeat timestamp in database via CSMS API
    try {
      await this.updateLastHeartbeat(chargePointId);
    } catch (error) {
      logger.error(`Failed to update last heartbeat for ${chargePointId}:`, error);
      // Continue - heartbeat response should still be sent
    }

    // Send response with current server time
    const response: HeartbeatResponse = {
      currentTime: new Date().toISOString()
    };

    const ocppResponse: OCPPMessage = [
      3, // CALLRESULT
      messageId,
      response as any
    ];

    this.connectionManager.sendMessage(chargePointId, ocppResponse);
  }

  private async updateLastHeartbeat(chargePointId: string): Promise<void> {
    const csmsApiUrl = process.env.CSMS_API_URL || 'http://csms-api:3000';
    
    try {
      await axios.post(
        `${csmsApiUrl}/api/internal/charge-points/${chargePointId}/heartbeat`,
        {
          timestamp: new Date().toISOString()
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.SERVICE_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      logger.debug(`Updated last heartbeat for ${chargePointId}`);
    } catch (error: any) {
      // Log error but don't throw - heartbeat response should still be sent
      if (error.response?.status === 404) {
        logger.warn(`Charge point ${chargePointId} not found in database - may need BootNotification first`);
      } else {
        logger.error(`Failed to update heartbeat for ${chargePointId}:`, error.message);
      }
      throw error; // Re-throw to be caught by caller
    }
  }
}

