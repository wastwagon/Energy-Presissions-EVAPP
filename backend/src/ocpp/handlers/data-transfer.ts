import { ConnectionManager } from '../services/connection-manager';
import { logger } from '../utils/logger';
import { DataTransferPayload, DataTransferResponse } from '../types/ocpp-message';
import axios from 'axios';

const CSMS_API_URL = process.env.CSMS_API_URL || 'http://csms-api:3000';
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || 'your-service-token-change-in-production';

export class DataTransferHandler {
  constructor(private connectionManager: ConnectionManager) {}

  async handle(chargePointId: string, messageId: string, payload: DataTransferPayload): Promise<void> {
    try {
      logger.info(`DataTransfer from ${chargePointId}, vendor: ${payload.vendorId}`);

      // Forward to CSMS API for processing
      const response = await axios.post(
        `${CSMS_API_URL}/api/internal/data-transfer`,
        {
          chargePointId,
          vendorId: payload.vendorId,
          messageId: payload.messageId,
          data: payload.data,
        },
        {
          headers: {
            'X-Service-Token': SERVICE_TOKEN,
          },
        },
      );

      const responsePayload: DataTransferResponse = {
        status: response.data.status || 'Accepted',
        data: response.data.data,
      };

      const ocppResponse: any = [3, messageId, responsePayload as any];
      this.connectionManager.sendMessage(chargePointId, ocppResponse);
    } catch (error: any) {
      logger.error(`Error handling DataTransfer from ${chargePointId}:`, error);
      const responsePayload: DataTransferResponse = {
        status: 'Rejected',
      };
      const ocppResponse: any = [3, messageId, responsePayload as any];
      this.connectionManager.sendMessage(chargePointId, ocppResponse);
    }
  }
}



