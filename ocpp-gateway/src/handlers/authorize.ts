import { ConnectionManager } from '../services/connection-manager';
import { logger } from '../utils/logger';
import { AuthorizePayload, AuthorizeResponse, IdTagInfo, OCPPMessage } from '../types/ocpp-message';
import axios from 'axios';

export class AuthorizeHandler {
  constructor(private connectionManager: ConnectionManager) {}

  async handle(chargePointId: string, messageId: string, payload: AuthorizePayload): Promise<void> {
    logger.info(`Processing Authorize from ${chargePointId} for IdTag: ${payload.idTag}`);

    try {
      // Validate IdTag with CSMS API
      const idTagInfo = await this.validateIdTag(payload.idTag);

      // Send response
      const response: AuthorizeResponse = {
        idTagInfo
      };

      const ocppResponse: OCPPMessage = [
        3, // CALLRESULT
        messageId,
        response as any
      ];

      this.connectionManager.sendMessage(chargePointId, ocppResponse);
      logger.info(`Authorize response sent for ${chargePointId}, IdTag: ${payload.idTag}, Status: ${idTagInfo.status}`);
    } catch (error) {
      logger.error(`Error processing Authorize from ${chargePointId}:`, error);
      
      // Send error response
      const idTagInfo: IdTagInfo = {
        status: 'Invalid'
      };

      const response: AuthorizeResponse = {
        idTagInfo
      };

      const ocppResponse: OCPPMessage = [
        3, // CALLRESULT
        messageId,
        response as any
      ];

      this.connectionManager.sendMessage(chargePointId, ocppResponse);
    }
  }

  private async validateIdTag(idTag: string): Promise<IdTagInfo> {
    const csmsApiUrl = process.env.CSMS_API_URL || 'http://csms-api:3000';
    
    try {
      const token = process.env.SERVICE_TOKEN || 'your-service-token-change-in-production';
      const response = await axios.get(`${csmsApiUrl}/api/internal/authorize/${idTag}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data as IdTagInfo;
    } catch (error) {
      logger.error(`Failed to validate IdTag ${idTag}:`, error);
      // Return Invalid status on error
      return {
        status: 'Invalid'
      };
    }
  }
}

