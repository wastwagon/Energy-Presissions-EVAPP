import { ConnectionManager } from '../services/connection-manager';
import { logger } from '../utils/logger';
import { GetLocalListVersionResponse } from '../types/ocpp-message';
import axios from 'axios';

const CSMS_API_URL = process.env.CSMS_API_URL || 'http://csms-api:3000';
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || 'your-service-token-change-in-production';

export class GetLocalListVersionHandler {
  constructor(private connectionManager: ConnectionManager) {}

  async handle(chargePointId: string, messageId: string, payload: {}): Promise<void> {
    try {
      logger.info(`GetLocalListVersion from ${chargePointId}`);

      // Get local list version from CSMS API
      const response = await axios.get(
        `${CSMS_API_URL}/api/internal/local-auth-list/version/${chargePointId}`,
        {
          headers: {
            'X-Service-Token': SERVICE_TOKEN,
          },
        },
      );

      const listVersion = response.data.listVersion || 0;

      const responsePayload: GetLocalListVersionResponse = {
        listVersion,
      };

      const ocppResponse: any = [3, messageId, responsePayload as any];
      this.connectionManager.sendMessage(chargePointId, ocppResponse);
    } catch (error: any) {
      logger.error(`Error handling GetLocalListVersion from ${chargePointId}:`, error);
      // Return version 0 if error
      const responsePayload: GetLocalListVersionResponse = {
        listVersion: 0,
      };
      const ocppResponse: any = [3, messageId, responsePayload as any];
      this.connectionManager.sendMessage(chargePointId, ocppResponse);
    }
  }
}



