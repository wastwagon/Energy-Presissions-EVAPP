import { WebSocket } from 'ws';
import { logger } from '../utils/logger';

interface Connection {
  ws: WebSocket;
  chargePointId: string;
  vendorId?: number;
  connectedAt: Date;
  lastMessageAt?: Date;
}

export class ConnectionManager {
  private connections: Map<string, Connection> = new Map();
  private vendorStatusCallbacks: Map<number, Set<(status: string) => void>> = new Map();

  addConnection(chargePointId: string, ws: WebSocket, vendorId?: number): void {
    const connection: Connection = {
      ws,
      chargePointId,
      vendorId,
      connectedAt: new Date()
    };
    
    this.connections.set(chargePointId, connection);
    logger.info(`Connection registered for charge point: ${chargePointId}${vendorId ? ` (vendor: ${vendorId})` : ''}`);
  }

  /**
   * Set vendorId for a connection (called after vendor resolution)
   */
  setVendorId(chargePointId: string, vendorId: number): void {
    const connection = this.connections.get(chargePointId);
    if (connection) {
      connection.vendorId = vendorId;
    }
  }

  /**
   * Get all connections for a vendor
   */
  getConnectionsByVendor(vendorId: number): Connection[] {
    return Array.from(this.connections.values()).filter(conn => conn.vendorId === vendorId);
  }

  /**
   * Close all connections for a vendor
   */
  closeVendorConnections(vendorId: number, code: number, reason: string): void {
    const connections = this.getConnectionsByVendor(vendorId);
    for (const connection of connections) {
      try {
        connection.ws.close(code, reason);
        this.connections.delete(connection.chargePointId);
        logger.info(`Closed connection for charge point ${connection.chargePointId} (vendor ${vendorId}): ${reason}`);
      } catch (error) {
        logger.error(`Error closing connection for ${connection.chargePointId}:`, error);
      }
    }
  }

  removeConnection(chargePointId: string): void {
    this.connections.delete(chargePointId);
    logger.info(`Connection removed for charge point: ${chargePointId}`);
  }

  getConnection(chargePointId: string): Connection | undefined {
    return this.connections.get(chargePointId);
  }

  getAllConnections(): Connection[] {
    return Array.from(this.connections.values());
  }

  isConnected(chargePointId: string): boolean {
    return this.connections.has(chargePointId);
  }

  updateLastMessage(chargePointId: string): void {
    const connection = this.connections.get(chargePointId);
    if (connection) {
      connection.lastMessageAt = new Date();
    }
  }

  sendMessage(chargePointId: string, message: any): boolean {
    const connection = this.connections.get(chargePointId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      logger.warn(`Cannot send message to ${chargePointId}: Connection not available`);
      return false;
    }

    try {
      connection.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error(`Error sending message to ${chargePointId}:`, error);
      return false;
    }
  }
}

