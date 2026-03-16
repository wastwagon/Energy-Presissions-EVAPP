import { ConnectionManager } from './connection-manager';
import { CommandManager } from './command-manager';
import { logger } from '../utils/logger';
import { OCPPMessage, OCPPMessageType } from '../types/ocpp-message';
import { BootNotificationHandler } from '../handlers/boot-notification';
import { HeartbeatHandler } from '../handlers/heartbeat';
import { StatusNotificationHandler } from '../handlers/status-notification';
import { AuthorizeHandler } from '../handlers/authorize';
import { StartTransactionHandler } from '../handlers/start-transaction';
import { MeterValuesHandler } from '../handlers/meter-values';
import { StopTransactionHandler } from '../handlers/stop-transaction';
import { GetLocalListVersionHandler } from '../handlers/get-local-list-version';
import { SendLocalListHandler } from '../handlers/send-local-list';
import { DataTransferHandler } from '../handlers/data-transfer';
import { ReserveNowHandler } from '../handlers/reserve-now';
import { CancelReservationHandler } from '../handlers/cancel-reservation';

export class MessageRouter {
  private handlers: Map<string, any> = new Map();

  constructor(
    private connectionManager: ConnectionManager,
    private commandManager: CommandManager,
  ) {
    // Initialize handlers
    // MVP handlers
    this.handlers.set('BootNotification', new BootNotificationHandler(connectionManager));
    this.handlers.set('Heartbeat', new HeartbeatHandler(connectionManager));
    this.handlers.set('StatusNotification', new StatusNotificationHandler(connectionManager));
    this.handlers.set('Authorize', new AuthorizeHandler(connectionManager));
    this.handlers.set('StartTransaction', new StartTransactionHandler(connectionManager));
    this.handlers.set('MeterValues', new MeterValuesHandler(connectionManager));
    this.handlers.set('StopTransaction', new StopTransactionHandler(connectionManager));
    
    // Advanced feature handlers
    this.handlers.set('GetLocalListVersion', new GetLocalListVersionHandler(connectionManager));
    this.handlers.set('SendLocalList', new SendLocalListHandler(connectionManager));
    this.handlers.set('DataTransfer', new DataTransferHandler(connectionManager));
    this.handlers.set('ReserveNow', new ReserveNowHandler(connectionManager));
    this.handlers.set('CancelReservation', new CancelReservationHandler(connectionManager));
  }

  async route(chargePointId: string, message: OCPPMessage, ws?: any): Promise<void> {
    try {
      // Update last message time
      this.connectionManager.updateLastMessage(chargePointId);

      // Parse message type
      const messageType = this.getMessageType(message);
      
      if (messageType === OCPPMessageType.CALL) {
        await this.handleCall(chargePointId, message, ws);
      } else if (messageType === OCPPMessageType.CALLRESULT) {
        await this.handleCallResult(chargePointId, message);
      } else if (messageType === OCPPMessageType.CALLERROR) {
        await this.handleCallError(chargePointId, message);
      } else {
        logger.warn(`Unknown message type from ${chargePointId}:`, message);
        this.sendError(chargePointId, null, 'FORMAT_VIOLATION', 'Unknown message type');
      }
    } catch (error) {
      logger.error(`Error routing message from ${chargePointId}:`, error);
      this.sendError(chargePointId, null, 'INTERNAL_ERROR', 'Internal processing error');
    }
  }

  private getMessageType(message: OCPPMessage): OCPPMessageType {
    if (Array.isArray(message)) {
      if (message.length >= 1) {
        const type = message[0];
        if (type === 2) return OCPPMessageType.CALL;
        if (type === 3) return OCPPMessageType.CALLRESULT;
        if (type === 4) return OCPPMessageType.CALLERROR;
      }
    }
    return OCPPMessageType.UNKNOWN;
  }

  private async handleCall(chargePointId: string, message: OCPPMessage, ws?: any): Promise<void> {
    if (!Array.isArray(message) || message.length < 3) {
      this.sendError(chargePointId, null, 'FORMAT_VIOLATION', 'Invalid CALL message format');
      return;
    }

    const messageId = message[1] as string;
    const action = message[2] as string;
    const payload = message[3] || {};

    logger.info(`Received ${action} from ${chargePointId} (messageId: ${messageId})`);

    // Get handler
    const handler = this.handlers.get(action);
    if (!handler) {
      logger.warn(`No handler for action: ${action}`);
      this.sendError(chargePointId, messageId, 'NOT_IMPLEMENTED', `Action ${action} not implemented`);
      return;
    }

    // Handle message - pass WebSocket to BootNotification handler for connection mapping
    try {
      if (action === 'BootNotification' && ws) {
        // BootNotification handler needs WebSocket for connection mapping
        await (handler as any).handle(chargePointId, messageId, payload, ws);
      } else {
        // Other handlers don't need WebSocket
        await handler.handle(chargePointId, messageId, payload);
      }
    } catch (error) {
      logger.error(`Error handling ${action} from ${chargePointId}:`, error);
      this.sendError(chargePointId, messageId, 'INTERNAL_ERROR', 'Error processing message');
    }
  }

  private async handleCallResult(chargePointId: string, message: OCPPMessage): Promise<void> {
    // Handle responses to our outgoing commands
    if (Array.isArray(message) && message.length >= 3) {
      const messageId = message[1] as string;
      const payload = message[2] || {};
      
      // Try to resolve pending command
      const handled = this.commandManager.handleCallResult(messageId, payload);
      if (!handled) {
        logger.debug(`Received CALLRESULT from ${chargePointId} (messageId: ${messageId}) - no pending command`);
      }
    }
  }

  private async handleCallError(chargePointId: string, message: OCPPMessage): Promise<void> {
    // Handle error responses
    if (Array.isArray(message) && message.length >= 4) {
      const messageId = message[1] as string;
      const errorCode = message[2] as string;
      const errorDescription = message[3] as string;
      
      // Try to reject pending command
      const handled = this.commandManager.handleCallError(messageId, errorCode, errorDescription);
      if (!handled) {
        logger.warn(`Received CALLERROR from ${chargePointId}: ${errorCode} - ${errorDescription} (no pending command)`);
      }
    }
  }

  private sendError(chargePointId: string, messageId: string | null, errorCode: string, errorDescription: string): void {
    const errorResponse: OCPPMessage = [
      4, // CALLERROR
      messageId,
      errorCode,
      errorDescription,
      {}
    ];

    this.connectionManager.sendMessage(chargePointId, errorResponse);
  }
}

