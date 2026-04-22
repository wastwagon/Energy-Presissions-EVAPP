import { ConnectionManager } from '../services/connection-manager';
import { logger } from '../utils/logger';
import { ReserveNowPayload, ReserveNowResponse } from '../types/ocpp-message';
import axios from 'axios';

const CSMS_API_URL = process.env.CSMS_API_URL || 'http://csms-api:3000';
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || 'your-service-token-change-in-production';

export class ReserveNowHandler {
  constructor(private connectionManager: ConnectionManager) {}

  async handle(chargePointId: string, messageId: string, payload: ReserveNowPayload): Promise<void> {
    try {
      logger.info(`ReserveNow from ${chargePointId}, reservationId: ${payload.reservationId}, connectorId: ${payload.connectorId}`);

      // Forward to CSMS API for processing
      const response = await axios.post(
        `${CSMS_API_URL}/api/internal/reservations/create`,
        {
          chargePointId,
          reservationId: payload.reservationId,
          connectorId: payload.connectorId,
          idTag: payload.idTag,
          parentIdTag: payload.parentIdTag,
          expiryDate: payload.expiryDate,
        },
        {
          headers: {
            'X-Service-Token': SERVICE_TOKEN,
          },
        },
      );

      const responsePayload: ReserveNowResponse = {
        status: response.data.status || 'Accepted',
      };

      const ocppResponse: any = [3, messageId, responsePayload as any];
      this.connectionManager.sendMessage(chargePointId, ocppResponse);
    } catch (error: any) {
      logger.error(`Error handling ReserveNow from ${chargePointId}:`, error);
      const responsePayload: ReserveNowResponse = {
        status: 'Rejected',
      };
      const ocppResponse: any = [3, messageId, responsePayload as any];
      this.connectionManager.sendMessage(chargePointId, ocppResponse);
    }
  }
}



