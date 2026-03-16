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
  private wsToChargePointId: Map<WebSocket, string> = new Map();
  private chargePointIdToWs: Map<string, WebSocket> = new Map();
  private vendorStatusCallbacks: Map<number, Set<(status: string) => void>> = new Map();

  addConnection(chargePointId: string, ws: WebSocket, vendorId?: number): void {
    const connection: Connection = {
      ws,
      chargePointId,
      vendorId,
      connectedAt: new Date()
    };
    
    this.connections.set(chargePointId, connection);
    this.wsToChargePointId.set(ws, chargePointId);
    this.chargePointIdToWs.set(chargePointId, ws);
    logger.info(`Connection registered for charge point: ${chargePointId}${vendorId ? ` (vendor: ${vendorId})` : ''}`);
  }

  /**
   * Add a temporary connection without charge point ID (will be mapped when BootNotification arrives)
   */
  addTemporaryConnection(ws: WebSocket, tempId: string): void {
    const connection: Connection = {
      ws,
      chargePointId: tempId,
      connectedAt: new Date()
    };
    
    this.connections.set(tempId, connection);
    this.wsToChargePointId.set(ws, tempId);
    logger.info(`Temporary connection registered: ${tempId} (waiting for BootNotification)`);
  }

  /**
   * Map a temporary connection to the actual charge point ID from BootNotification
   */
  mapConnectionToChargePointId(ws: WebSocket, chargePointId: string, vendorId?: number): boolean {
    const tempId = this.wsToChargePointId.get(ws);
    if (!tempId) {
      logger.warn(`Cannot map connection: WebSocket not found`);
      return false;
    }

    // Remove temporary connection
    this.connections.delete(tempId);
    this.wsToChargePointId.delete(ws);

    // Add connection with actual charge point ID
    const connection: Connection = {
      ws,
      chargePointId,
      vendorId,
      connectedAt: new Date()
    };

    this.connections.set(chargePointId, connection);
    this.wsToChargePointId.set(ws, chargePointId);
    this.chargePointIdToWs.set(chargePointId, ws);
    
    logger.info(`Connection mapped from temporary ID ${tempId} to charge point: ${chargePointId}${vendorId ? ` (vendor: ${vendorId})` : ''}`);
    return true;
  }

  /**
   * Get charge point ID from WebSocket connection
   */
  getChargePointId(ws: WebSocket): string | null {
    return this.wsToChargePointId.get(ws) || null;
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
    const connection = this.connections.get(chargePointId);
    if (connection) {
      this.wsToChargePointId.delete(connection.ws);
      this.chargePointIdToWs.delete(chargePointId);
    }
    this.connections.delete(chargePointId);
    logger.info(`Connection removed for charge point: ${chargePointId}`);
  }

  /**
   * Remove connection by WebSocket (useful when charge point ID is unknown)
   */
  removeConnectionByWebSocket(ws: WebSocket): void {
    const chargePointId = this.wsToChargePointId.get(ws);
    if (chargePointId) {
      this.removeConnection(chargePointId);
    } else {
      // Try to find and remove by iterating
      for (const [id, conn] of this.connections.entries()) {
        if (conn.ws === ws) {
          this.removeConnection(id);
          break;
        }
      }
    }
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

