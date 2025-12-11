import { ConnectionManager } from '../services/connection-manager';
import { logger } from '../utils/logger';
import { SendLocalListPayload, SendLocalListResponse } from '../types/ocpp-message';
import axios from 'axios';

const CSMS_API_URL = process.env.CSMS_API_URL || 'http://csms-api:3000';
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || 'your-service-token-change-in-production';

export class SendLocalListHandler {
  constructor(private connectionManager: ConnectionManager) {}

  async handle(chargePointId: string, messageId: string, payload: SendLocalListPayload): Promise<void> {
    try {
      logger.info(`SendLocalList from ${chargePointId}, version: ${payload.listVersion}, type: ${payload.updateType}`);

      // Forward to CSMS API for processing
      const response = await axios.post(
        `${CSMS_API_URL}/api/internal/local-auth-list/send`,
        {
          chargePointId,
          listVersion: payload.listVersion,
          updateType: payload.updateType,
          localAuthorizationList: payload.localAuthorizationList || [],
        },
        {
          headers: {
            'X-Service-Token': SERVICE_TOKEN,
          },
        },
      );

      const responsePayload: SendLocalListResponse = {
        status: response.data.status || 'Accepted',
      };

      const ocppResponse: any = [3, messageId, responsePayload as any];
      this.connectionManager.sendMessage(chargePointId, ocppResponse);
    } catch (error: any) {
      logger.error(`Error handling SendLocalList from ${chargePointId}:`, error);
      const responsePayload: SendLocalListResponse = {
        status: 'Failed',
      };
      const ocppResponse: any = [3, messageId, responsePayload as any];
      this.connectionManager.sendMessage(chargePointId, ocppResponse);
    }
  }
}



