import { logger } from '../utils/logger';

interface PendingCommand {
  messageId: string;
  action: string;
  chargePointId: string;
  timestamp: Date;
  resolve: (response: any) => void;
  reject: (error: any) => void;
  timeout: NodeJS.Timeout;
}

export class CommandManager {
  private pendingCommands: Map<string, PendingCommand> = new Map();
  private readonly COMMAND_TIMEOUT = 30000; // 30 seconds

  /**
   * Register a pending command and return a promise that resolves when response is received
   */
  registerCommand(
    messageId: string,
    action: string,
    chargePointId: string,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(messageId);
        reject(new Error(`Command timeout: ${action} for ${chargePointId}`));
      }, this.COMMAND_TIMEOUT);

      const command: PendingCommand = {
        messageId,
        action,
        chargePointId,
        timestamp: new Date(),
        resolve,
        reject,
        timeout,
      };

      this.pendingCommands.set(messageId, command);
      logger.debug(`Registered pending command: ${action} (${messageId}) for ${chargePointId}`);
    });
  }

  /**
   * Handle CALLRESULT response
   */
  handleCallResult(messageId: string, payload: any): boolean {
    const command = this.pendingCommands.get(messageId);
    if (!command) {
      logger.warn(`Received CALLRESULT for unknown messageId: ${messageId}`);
      return false;
    }

    clearTimeout(command.timeout);
    this.pendingCommands.delete(messageId);
    logger.info(`Received CALLRESULT for ${command.action} (${messageId}) from ${command.chargePointId}`);
    command.resolve(payload);
    return true;
  }

  /**
   * Handle CALLERROR response
   */
  handleCallError(messageId: string, errorCode: string, errorDescription: string): boolean {
    const command = this.pendingCommands.get(messageId);
    if (!command) {
      logger.warn(`Received CALLERROR for unknown messageId: ${messageId}`);
      return false;
    }

    clearTimeout(command.timeout);
    this.pendingCommands.delete(messageId);
    logger.warn(`Received CALLERROR for ${command.action} (${messageId}) from ${command.chargePointId}: ${errorCode} - ${errorDescription}`);
    command.reject(new Error(`${errorCode}: ${errorDescription}`));
    return true;
  }

  /**
   * Get pending command count
   */
  getPendingCount(): number {
    return this.pendingCommands.size;
  }

  /**
   * Clear all pending commands (e.g., on disconnect)
   */
  clearPending(chargePointId: string): void {
    const toRemove: string[] = [];
    this.pendingCommands.forEach((command, messageId) => {
      if (command.chargePointId === chargePointId) {
        clearTimeout(command.timeout);
        command.reject(new Error('Charge point disconnected'));
        toRemove.push(messageId);
      }
    });
    toRemove.forEach((id) => this.pendingCommands.delete(id));
    if (toRemove.length > 0) {
      logger.info(`Cleared ${toRemove.length} pending commands for ${chargePointId}`);
    }
  }
}



