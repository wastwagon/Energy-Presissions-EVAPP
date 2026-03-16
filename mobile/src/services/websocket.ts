/**
 * WebSocket Service for Real-time Updates
 */

import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getWebSocketUrl } from '../config/api.config';

class WebSocketService {
  private socket: Socket | null = null;
  private wsUrl: string;

  constructor() {
    // WebSocket URL - configured via api.config.ts
    this.wsUrl = getWebSocketUrl();
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    const token = await AsyncStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }

    this.socket = io(this.wsUrl, {
      transports: ['websocket'],
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Subscribe to event
   */
  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
   * Unsubscribe from event
   */
  off(event: string, callback?: (data: any) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Emit event
   */
  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();
