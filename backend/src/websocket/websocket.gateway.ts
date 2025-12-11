import {
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@NestWebSocketGateway({
  cors: {
    origin: '*',
  },
  path: '/ws',
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  static instance: WebSocketGateway;
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private clients: Map<string, Socket> = new Map();

  constructor() {
    WebSocketGateway.instance = this;
  }

  handleConnection(client: Socket) {
    this.clients.set(client.id, client);
    this.logger.log(`Client connected: ${client.id}`);
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
    this.server.emit('chargePointStatus', {
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
    this.server.emit('connectorStatus', {
      type: 'connectorStatus',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast transaction started
  broadcastTransactionStarted(data: {
    transactionId: number;
    chargePointId: string;
    connectorId: number;
    idTag?: string;
    startTime: Date;
  }) {
    this.server.emit('transactionStarted', {
      type: 'transactionStarted',
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Broadcast transaction stopped
  broadcastTransactionStopped(data: {
    transactionId: number;
    chargePointId: string;
    totalEnergyKwh?: number;
    totalCost?: number;
    stopTime: Date;
  }) {
    this.server.emit('transactionStopped', {
      type: 'transactionStopped',
      data,
      timestamp: new Date().toISOString(),
    });
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
    this.server.emit('meterValue', {
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

