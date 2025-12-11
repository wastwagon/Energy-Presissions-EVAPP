import { io, Socket } from 'socket.io-client';

export type WebSocketEventType =
  | 'chargePointStatus'
  | 'connectorStatus'
  | 'transactionStarted'
  | 'transactionStopped'
  | 'meterValue'
  | 'connectionStatus';

export interface WebSocketEvent {
  type: WebSocketEventType;
  data: any;
  timestamp: string;
}

type EventHandler = (event: WebSocketEvent) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<WebSocketEventType, Set<EventHandler>> = new Map();
  private isConnecting = false;
  private wsUrl: string;

  constructor() {
    // Use WebSocket URL from environment or default
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const host = window.location.hostname;
    const port = window.location.port || (protocol === 'https:' ? '443' : '80');
    this.wsUrl = `${protocol}//${host}:${port}`;
  }

  connect(): void {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    console.log(`Connecting to WebSocket: ${this.wsUrl}`);

    try {
      this.socket = io(this.wsUrl, {
        path: '/ws',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 3000,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.emit({ type: 'connectionStatus', data: { connected: true }, timestamp: new Date().toISOString() });
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.emit({ type: 'connectionStatus', data: { connected: false }, timestamp: new Date().toISOString() });
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.isConnecting = false;
      });

      // Listen to all event types
      const eventTypes: WebSocketEventType[] = [
        'chargePointStatus',
        'connectorStatus',
        'transactionStarted',
        'transactionStopped',
        'meterValue',
      ];

      eventTypes.forEach((eventType) => {
        this.socket!.on(eventType, (data: any) => {
          this.handleMessage({ type: eventType, data, timestamp: new Date().toISOString() });
        });
      });
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
    }
  }

  private handleMessage(message: WebSocketEvent): void {
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${message.type}:`, error);
        }
      });
    }
  }

  on(eventType: WebSocketEventType, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  off(eventType: WebSocketEventType, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: WebSocketEvent): void {
    this.handleMessage(event);
  }

  send(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket is not connected. Message not sent:', event, data);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventHandlers.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// Auto-connect on import (can be disabled if needed)
if (typeof window !== 'undefined') {
  websocketService.connect();
}
