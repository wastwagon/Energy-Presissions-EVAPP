import { ConnectionManager } from '../services/connection-manager';
import { logger } from '../utils/logger';
import { CancelReservationPayload, CancelReservationResponse } from '../types/ocpp-message';
import axios from 'axios';

const CSMS_API_URL = process.env.CSMS_API_URL || 'http://csms-api:3000';
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || 'your-service-token-change-in-production';

export class CancelReservationHandler {
  constructor(private connectionManager: ConnectionManager) {}

  async handle(chargePointId: string, messageId: string, payload: CancelReservationPayload): Promise<void> {
    try {
      logger.info(`CancelReservation from ${chargePointId}, reservationId: ${payload.reservationId}`);

      // Forward to CSMS API for processing
      const response = await axios.post(
        `${CSMS_API_URL}/api/internal/reservations/cancel`,
        {
          chargePointId,
          reservationId: payload.reservationId,
        },
        {
          headers: {
            'X-Service-Token': SERVICE_TOKEN,
          },
        },
      );

      const responsePayload: CancelReservationResponse = {
        status: response.data.status || 'Accepted',
      };

      const ocppResponse: any = [3, messageId, responsePayload as any];
      this.connectionManager.sendMessage(chargePointId, ocppResponse);
    } catch (error: any) {
      logger.error(`Error handling CancelReservation from ${chargePointId}:`, error);
      const responsePayload: CancelReservationResponse = {
        status: 'Rejected',
      };
      const ocppResponse: any = [3, messageId, responsePayload as any];
      this.connectionManager.sendMessage(chargePointId, ocppResponse);
    }
  }
}



