import {
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { collectAllowedOrigins, isBrowserOriginAllowed } from '../common/cors-origins';
import { resolveJwtSecret } from '../common/utils/jwt-secret';

type SocketUser = {
  userId: number;
  email?: string;
  accountType?: string;
  vendorId?: number;
};

@NestWebSocketGateway({
  cors: {
    // Recompute allowed origins on each handshake so this matches `main.ts` CORS after ConfigModule loads .env
    // (module-level `collectAllowedOrigins()` can run before dotenv is applied).
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const allowed = collectAllowedOrigins();
      if (isBrowserOriginAllowed(origin, allowed)) {
        callback(null, true);
        return;
      }
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  },
  path: '/ws',
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  static instance: WebSocketGateway;
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private clients: Map<string, Socket> = new Map();

  constructor(private readonly configService: ConfigService) {
    WebSocketGateway.instance = this;
  }

  private parseToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.trim().replace(/^Bearer\s+/i, '');
    }

    const header = client.handshake.headers?.authorization;
    if (typeof header === 'string' && header.trim()) {
      return header.trim().replace(/^Bearer\s+/i, '');
    }

    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string' && queryToken.trim()) {
      return queryToken.trim().replace(/^Bearer\s+/i, '');
    }

    return null;
  }

  private authenticateClient(client: Socket): SocketUser | null {
    const token = this.parseToken(client);
    if (!token) {
      return null;
    }

    const secret = resolveJwtSecret(this.configService);
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload;
    const decodedRecord = decoded as jwt.JwtPayload & Record<string, unknown>;
    const subRaw = decodedRecord.sub;
    const userId = typeof subRaw === 'string' ? parseInt(subRaw, 10) : Number(subRaw);
    if (!Number.isFinite(userId)) {
      return null;
    }

    const vendorRaw = decodedRecord.vendorId ?? decodedRecord.tenantId;
    const vendorId =
      vendorRaw == null
        ? undefined
        : typeof vendorRaw === 'string'
          ? parseInt(vendorRaw, 10)
          : Number(vendorRaw);

    return {
      userId,
      email: typeof decodedRecord.email === 'string' ? decodedRecord.email : undefined,
      accountType:
        typeof decodedRecord.accountType === 'string' ? decodedRecord.accountType : undefined,
      vendorId: Number.isFinite(vendorId) ? vendorId : undefined,
    };
  }

  private roomForUser(userId: number): string {
    return `user:${userId}`;
  }

  private roomForVendor(vendorId: number): string {
    return `vendor:${vendorId}`;
  }

  private roomForRole(role: string): string {
    return `role:${role}`;
  }

  private emitToAuthenticated(event: string, payload: unknown): void {
    this.server.to('authenticated').emit(event, payload);
  }

  handleConnection(client: Socket) {
    let user: SocketUser | null = null;
    try {
      user = this.authenticateClient(client);
    } catch {
      user = null;
    }

    if (!user) {
      this.logger.warn(`Rejected unauthenticated WebSocket client: ${client.id}`);
      client.emit('connectionStatus', { connected: false, reason: 'Unauthorized' });
      client.disconnect(true);
      return;
    }

    (client.data as Record<string, unknown>).user = user;
    this.clients.set(client.id, client);
    client.join('authenticated');
    client.join(this.roomForUser(user.userId));
    if (user.vendorId) {
      client.join(this.roomForVendor(user.vendorId));
    }
    if (user.accountType) {
      client.join(this.roomForRole(user.accountType));
    }
    this.logger.log(`Client connected: ${client.id} (user ${user.userId})`);
    client.emit('connectionStatus', { connected: true });
  }

  handleDisconnect(client: Socket) {
    this.clients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Broadcast charge point status update
  broadcastChargePointStatus(data: {
    chargePointId: string;
    status: string;
    lastSeen?: Date;
    lastHeartbeat?: Date;
  }) {
    this.emitToAuthenticated('chargePointStatus', {
      type: 'chargePointStatus',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast connector status update
  broadcastConnectorStatus(data: {
    chargePointId: string;
    connectorId: number;
    status: string;
    errorCode?: string;
  }) {
    this.emitToAuthenticated('connectorStatus', {
      type: 'connectorStatus',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast transaction started
  broadcastTransactionStarted(data: {
    transactionId: number;
    chargePointId: string;
    connectorId?: number;
    idTag?: string;
    userId?: number;
    vendorId?: number;
    startTime: Date;
  }) {
    const payload = {
      type: 'transactionStarted',
      data,
      timestamp: new Date().toISOString(),
    };
    if (data.userId) {
      this.server.to(this.roomForUser(data.userId)).emit('transactionStarted', payload);
    }
    if (data.vendorId) {
      this.server.to(this.roomForVendor(data.vendorId)).emit('transactionStarted', payload);
    }
    this.server.to(this.roomForRole('SuperAdmin')).emit('transactionStarted', payload);
  }

  // Broadcast transaction stopped
  broadcastTransactionStopped(data: {
    transactionId: number;
    chargePointId: string;
    totalEnergyKwh?: number;
    totalCost?: number;
    stopTime: Date;
    userId?: number;
    vendorId?: number;
  }) {
    this.logger.log(`Broadcasting transaction stopped: ${data.transactionId}`);
    const payload = {
      type: 'transactionStopped',
      data,
      timestamp: new Date().toISOString(),
    };
    if (data.userId) {
      this.server.to(this.roomForUser(data.userId)).emit('transactionStopped', payload);
    }
    if (data.vendorId) {
      this.server.to(this.roomForVendor(data.vendorId)).emit('transactionStopped', payload);
    }
    this.server.to(this.roomForRole('SuperAdmin')).emit('transactionStopped', payload);
  }

  // Broadcast wallet balance update
  broadcastWalletBalanceUpdate(data: {
    userId: number;
    balance: number;
    currency: string;
    transactionId?: number;
  }) {
    const payload = {
      type: 'walletBalanceUpdate',
      data,
      timestamp: new Date().toISOString(),
    };
    this.server.to(this.roomForUser(data.userId)).emit('walletBalanceUpdate', payload);
  }

  // Broadcast dashboard stats update
  broadcastDashboardStatsUpdate(data: {
    vendorId?: number;
    stats: any;
  }) {
    this.logger.log(`Broadcasting dashboard stats update for vendor ${data.vendorId || 'all'}`);
    const payload = {
      type: 'dashboardStatsUpdate',
      data,
      timestamp: new Date().toISOString(),
    };
    if (data.vendorId) {
      this.server.to(this.roomForVendor(data.vendorId)).emit('dashboardStatsUpdate', payload);
    }
    this.server.to(this.roomForRole('SuperAdmin')).emit('dashboardStatsUpdate', payload);
  }

  // Broadcast meter value
  broadcastMeterValue(data: {
    transactionId?: number;
    chargePointId: string;
    connectorId: number;
    value: number;
    measurand?: string;
    unit?: string;
  }) {
    this.emitToAuthenticated('meterValue', {
      type: 'meterValue',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }
}

