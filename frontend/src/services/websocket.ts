import { io, Socket } from 'socket.io-client';

export type WebSocketEventType =
  | 'chargePointStatus'
  | 'connectorStatus'
  | 'transactionStarted'
  | 'transactionStopped'
  | 'meterValue'
  | 'connectionStatus'
  | 'walletBalanceUpdate'
  | 'dashboardStatsUpdate';

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
    // Use WebSocket URL from environment variable or construct from API URL
    if (import.meta.env.VITE_WS_URL) {
      this.wsUrl = import.meta.env.VITE_WS_URL;
    } else {
      // Construct WebSocket URL based on current location
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        // If accessing via NGINX proxy (port 8080), use relative path
        if (port === '8080' || window.location.host.includes(':8080')) {
          // Use relative URL - socket.io will handle the protocol upgrade
          this.wsUrl = window.location.origin;
        } else if (port === '3001' || window.location.host.includes(':3001')) {
          // Same origin as Vite; proxy forwards /ws to Nest (avoids cross-origin WS + wrong host on phones)
          this.wsUrl = window.location.origin;
        } else {
          // Default: use current origin
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          this.wsUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
        }
      } else {
        // Server-side fallback
        this.wsUrl = 'ws://localhost:3000';
      }
    }
  }

  connect(): void {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Ensure we're using wss:// for production HTTPS
      let wsUrl = this.wsUrl.startsWith('http')
        ? this.wsUrl.replace('http://', 'ws://').replace('https://', 'wss://')
        : this.wsUrl;

      // Parse URL to separate host from path - avoids "Invalid namespace" when path is in URL
      let path = '/ws';
      try {
        const url = new URL(wsUrl);
        if (url.pathname && url.pathname !== '/' && url.pathname !== '') {
          path = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
          wsUrl = `${url.protocol}//${url.host}`;
        }
      } catch {
        // Keep original wsUrl if parsing fails
      }

      console.log(`Connecting to WebSocket: ${wsUrl}${path}`);
      const token = localStorage.getItem('token');

      this.socket = io(wsUrl, {
        path,
        auth: token ? { token: `Bearer ${token}` } : undefined,
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
        'walletBalanceUpdate',
        'dashboardStatsUpdate',
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

// Connect only when user is authenticated - avoids "Invalid namespace" on login/register
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');
  if (token) {
    websocketService.connect();
  }
}
