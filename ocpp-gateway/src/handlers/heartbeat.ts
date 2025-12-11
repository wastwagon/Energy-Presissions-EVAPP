import { ConnectionManager } from '../services/connection-manager';
import { logger } from '../utils/logger';
import { HeartbeatResponse, OCPPMessage } from '../types/ocpp-message';

export class HeartbeatHandler {
  constructor(private connectionManager: ConnectionManager) {}

  async handle(chargePointId: string, messageId: string, payload: any): Promise<void> {
    logger.debug(`Processing Heartbeat from ${chargePointId}`);

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
    
    // TODO: Update last_seen timestamp in database via CSMS API
  }
}

