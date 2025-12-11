import { WebSocket } from 'ws';
import { logger } from '../utils/logger';

interface Connection {
  ws: WebSocket;
  chargePointId: string;
  tenantId?: number;
  connectedAt: Date;
  lastMessageAt?: Date;
}

export class ConnectionManager {
  private connections: Map<string, Connection> = new Map();
  private tenantStatusCallbacks: Map<number, Set<(status: string) => void>> = new Map();

  addConnection(chargePointId: string, ws: WebSocket, tenantId?: number): void {
    const connection: Connection = {
      ws,
      chargePointId,
      tenantId,
      connectedAt: new Date()
    };
    
    this.connections.set(chargePointId, connection);
    logger.info(`Connection registered for charge point: ${chargePointId}${tenantId ? ` (tenant: ${tenantId})` : ''}`);
  }

  /**
   * Set tenantId for a connection (called after tenant resolution)
   */
  setTenantId(chargePointId: string, tenantId: number): void {
    const connection = this.connections.get(chargePointId);
    if (connection) {
      connection.tenantId = tenantId;
    }
  }

  /**
   * Get all connections for a tenant
   */
  getConnectionsByTenant(tenantId: number): Connection[] {
    return Array.from(this.connections.values()).filter(conn => conn.tenantId === tenantId);
  }

  /**
   * Close all connections for a tenant
   */
  closeTenantConnections(tenantId: number, code: number, reason: string): void {
    const connections = this.getConnectionsByTenant(tenantId);
    for (const connection of connections) {
      try {
        connection.ws.close(code, reason);
        this.connections.delete(connection.chargePointId);
        logger.info(`Closed connection for charge point ${connection.chargePointId} (tenant ${tenantId}): ${reason}`);
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

