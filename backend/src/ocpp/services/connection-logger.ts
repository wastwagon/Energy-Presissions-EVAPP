import axios from 'axios';
import { logger } from '../utils/logger';

const CSMS_API_URL = process.env.CSMS_API_URL || 'http://csms-api:3000';
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || '';

export type ConnectionEventType =
  | 'connection_attempt'
  | 'connection_success'
  | 'connection_failed'
  | 'connection_closed'
  | 'error'
  | 'message_error';

export type ConnectionStatus = 'success' | 'failed' | 'rejected' | 'timeout' | 'error';

/**
 * Service to log connection events to CSMS API for debugging
 */
export class ConnectionLogger {
  /**
   * Log a connection event
   */
  static async logEvent(data: {
    chargePointId: string;
    eventType: ConnectionEventType;
    status?: ConnectionStatus;
    errorCode?: string;
    errorMessage?: string;
    closeCode?: number;
    closeReason?: string;
    ipAddress?: string;
    userAgent?: string;
    requestUrl?: string;
    vendorId?: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await axios.post(
        `${CSMS_API_URL}/api/internal/connection-logs`,
        data,
        {
          headers: {
            Authorization: `Bearer ${SERVICE_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        },
      );
    } catch (error: any) {
      // Don't throw - logging failures shouldn't break the connection flow
      logger.error(`Failed to log connection event: ${error.message}`);
    }
  }

  /**
   * Log connection attempt
   */
  static async logConnectionAttempt(
    chargePointId: string,
    ipAddress?: string,
    userAgent?: string,
    requestUrl?: string,
    vendorId?: number,
  ): Promise<void> {
    await this.logEvent({
      chargePointId,
      eventType: 'connection_attempt',
      status: 'success',
      ipAddress,
      userAgent,
      requestUrl,
      vendorId,
    });
  }

  /**
   * Log successful connection
   */
  static async logConnectionSuccess(
    chargePointId: string,
    vendorId?: number,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      chargePointId,
      eventType: 'connection_success',
      status: 'success',
      vendorId,
      metadata,
    });
  }

  /**
   * Log connection failure
   */
  static async logConnectionFailure(
    chargePointId: string,
    errorCode: string,
    errorMessage: string,
    closeCode?: number,
    closeReason?: string,
    vendorId?: number,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      chargePointId,
      eventType: 'connection_failed',
      status: 'failed',
      errorCode,
      errorMessage,
      closeCode,
      closeReason,
      vendorId,
      metadata,
    });
  }

  /**
   * Log connection closed
   */
  static async logConnectionClosed(
    chargePointId: string,
    closeCode?: number,
    closeReason?: string,
    vendorId?: number,
  ): Promise<void> {
    await this.logEvent({
      chargePointId,
      eventType: 'connection_closed',
      status: 'success',
      closeCode,
      closeReason,
      vendorId,
    });
  }

  /**
   * Log error
   */
  static async logError(
    chargePointId: string,
    errorCode: string,
    errorMessage: string,
    vendorId?: number,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      chargePointId,
      eventType: 'error',
      status: 'error',
      errorCode,
      errorMessage,
      vendorId,
      metadata,
    });
  }

  /**
   * Log message error
   */
  static async logMessageError(
    chargePointId: string,
    errorCode: string,
    errorMessage: string,
    rawMessage?: string,
    vendorId?: number,
  ): Promise<void> {
    await this.logEvent({
      chargePointId,
      eventType: 'message_error',
      status: 'error',
      errorCode,
      errorMessage,
      vendorId,
      metadata: { rawMessage },
    });
  }
}



