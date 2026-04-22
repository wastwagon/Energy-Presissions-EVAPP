/**
 * Embeds OCPP 1.6J WebSocket handling on the same HTTP server as Nest (single host/port).
 * Chargers: wss://api.example.com/ocpp  —  CSMS internal calls: http://127.0.0.1:${PORT}/command/...
 */
import { INestApplication } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';
import Redis from 'ioredis';
import axios from 'axios';
import { logger } from './utils/logger';
import { ConnectionManager } from './services/connection-manager';
import { CommandManager } from './services/command-manager';
import { MessageRouter } from './services/message-router';
import { VendorResolver } from './services/vendor-resolver';
import { ConnectionLogger } from './services/connection-logger';

const VENDOR_STATUS_CHANNEL = 'vendor.status.changed';

export type MergedOcppHandle = {
  shutdown: () => Promise<void>;
};

function extractChargePointId(pathname: string): string | null {
  const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const parts = normalizedPath.split('/').filter((p) => p);

  if (parts.length >= 2 && parts[0] === 'ocpp') {
    return parts[1];
  }
  if (parts.length === 1 && parts[0] === 'ocpp') {
    return null;
  }
  return null;
}

function sendError(ws: WebSocket, errorCode: string, errorDescription: string) {
  const errorResponse = [4, null, errorCode, errorDescription, {}];
  try {
    ws.send(JSON.stringify(errorResponse));
  } catch (error) {
    logger.error('Error sending error response:', error);
  }
}

/**
 * Register OCPP HTTP + WS on the Nest application. Call immediately after NestFactory.create,
 * before app.init(), so /command and /health/connection run before Nest body parsers where needed.
 */
export function setupMergedOcppGateway(app: INestApplication): MergedOcppHandle {
  const LOG_RAW_FRAMES = process.env.LOG_RAW_FRAMES === 'true';
  const connectionManager = new ConnectionManager();
  const commandManager = new CommandManager();
  const messageRouter = new MessageRouter(connectionManager, commandManager);
  const vendorResolver = new VendorResolver();

  const ocppHttpMiddleware = (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const pathname = (req.url || '').split('?')[0] || '';

    if (req.method === 'OPTIONS' && (pathname.startsWith('/command') || pathname.startsWith('/health/connection'))) {
      res.status(200).end();
      return;
    }

    if (req.method === 'GET' && pathname.startsWith('/health/connection/')) {
      const parts = pathname.split('/').filter(Boolean);
      const chargePointId = parts[2];
      if (!chargePointId) {
        res.status(400).json({ error: 'Charge point ID required' });
        return;
      }
      const isConnected = connectionManager.isConnected(chargePointId);
      res.status(200).json({ connected: isConnected });
      return;
    }

    if (req.method === 'POST' && pathname.startsWith('/command/')) {
      const chargePointId = pathname.split('/').filter(Boolean)[1];
      if (!chargePointId) {
        res.status(400).json({ error: 'Charge point ID required' });
        return;
      }

      const runCommand = async (command: { message?: unknown }) => {
        try {
          const message = command.message;
          if (!Array.isArray(message) || message.length < 3) {
            res.status(400).json({ error: 'Invalid OCPP message format' });
            return;
          }

          const messageId = message[1] as string;
          const action = message[2] as string;

          const responsePromise = commandManager.registerCommand(messageId, action, chargePointId);
          const success = connectionManager.sendMessage(chargePointId, message);

          if (!success) {
            commandManager.clearPending(chargePointId);
            res.status(503).json({ error: 'Charge point not connected' });
            return;
          }

          try {
            const response = await responsePromise;
            res.status(200).json({
              success: true,
              message: 'Command sent',
              response,
            });
          } catch (error: any) {
            res.status(504).json({
              error: 'Command timeout or error',
              message: error.message,
            });
          }
        } catch (error: any) {
          logger.error('Error processing command:', error);
          res.status(400).json({ error: 'Invalid command format', message: error.message });
        }
      };

      const body = (req as Request & { body?: unknown }).body;
      if (body && typeof body === 'object' && body !== null && 'message' in body) {
        void runCommand(body as { message?: unknown });
        return;
      }

      const chunks: Buffer[] = [];
      req.on('data', (c) => chunks.push(c as Buffer));
      req.on('end', async () => {
        try {
          const raw = Buffer.concat(chunks).toString();
          const command = JSON.parse(raw || '{}');
          await runCommand(command);
        } catch (error: any) {
          logger.error('Error processing command:', error);
          res.status(400).json({ error: 'Invalid command format', message: error.message });
        }
      });
      req.on('error', () => {
        if (!res.headersSent) {
          res.status(400).end();
        }
      });
      return;
    }

    next();
  };

  app.use(ocppHttpMiddleware);

  const explicitRedis = process.env.REDIS_URL?.trim();
  // Only use Docker hostname when unset outside production (compose sets REDIS_URL explicitly in prod).
  const redisUrl =
    explicitRedis ||
    (process.env.NODE_ENV !== 'production' ? 'redis://redis:6379' : '');

  let redisSubscriber: Redis | null = null;

  async function handleVendorStatusChange(payload: {
    vendorId: number;
    status: 'active' | 'suspended' | 'disabled';
    reason?: string;
    at: string;
  }) {
    logger.info(`Vendor status changed: ${payload.vendorId} -> ${payload.status}`);

    if (payload.status === 'disabled') {
      connectionManager.closeVendorConnections(payload.vendorId, 4003, 'vendor_disabled');
    } else if (payload.status === 'suspended') {
      connectionManager.closeVendorConnections(payload.vendorId, 4002, 'vendor_suspended');
    }

    const connections = connectionManager.getConnectionsByVendor(payload.vendorId);
    for (const conn of connections) {
      vendorResolver.clearCache(conn.chargePointId);
    }
  }

  if (redisUrl) {
    redisSubscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: true,
      retryStrategy: (times: number) => {
        if (times > 15) return null;
        return Math.min(times * 200, 3000);
      },
    });
    redisSubscriber.on('error', (err) => {
      logger.warn(`OCPP Redis subscriber error: ${err.message}`);
    });
    redisSubscriber.on('message', (channel, message) => {
      if (channel === VENDOR_STATUS_CHANNEL) {
        try {
          const payload = JSON.parse(message);
          void handleVendorStatusChange(payload);
        } catch (error) {
          logger.error('Error parsing vendor status change message:', error);
        }
      }
    });
    redisSubscriber.subscribe(VENDOR_STATUS_CHANNEL).catch((err) => {
      logger.warn(`OCPP Redis subscribe failed: ${(err as Error).message}`);
    });
  } else {
    logger.warn(
      'REDIS_URL is not set; OCPP vendor pub/sub disabled. On Render, link Key Value REDIS_URL to this service.',
    );
  }

  const httpServer = app.getHttpServer();
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', async (ws, req) => {
    const urlString = req.url || '';
    const url = urlString.startsWith('http')
      ? new URL(urlString)
      : new URL(urlString, `http://${req.headers.host || 'localhost'}`);
    const chargePointId = extractChargePointId(url.pathname);

    const ipAddress = req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const pathParts = url.pathname.split('/').filter((p) => p);
    const isValidPath =
      (pathParts.length === 1 && pathParts[0] === 'ocpp') ||
      (pathParts.length === 0 && url.pathname === '/ocpp/') ||
      (pathParts.length === 2 && pathParts[0] === 'ocpp' && pathParts[1]);

    if (!isValidPath) {
      logger.warn(`Connection rejected: Invalid path - ${url.pathname}`);
      await ConnectionLogger.logConnectionFailure(
        'UNKNOWN',
        'INVALID_PATH',
        `Invalid WebSocket path: ${url.pathname}`,
        1008,
        'Invalid path',
        undefined,
        { ipAddress, userAgent, requestUrl: req.url },
      );
      ws.close(1008, 'Invalid path');
      return;
    }

    if (!chargePointId) {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      connectionManager.addTemporaryConnection(ws, tempId);
      logger.info(`Temporary connection established (waiting for BootNotification): ${tempId} from ${ipAddress}`);
      await ConnectionLogger.logConnectionAttempt(tempId, ipAddress, userAgent, req.url);
    } else {
      logger.info(`New WebSocket connection from charge point: ${chargePointId}`);
      await ConnectionLogger.logConnectionAttempt(chargePointId, ipAddress, userAgent, req.url);
    }

    if (chargePointId) {
      try {
        const vendorId = await vendorResolver.resolveVendorId(chargePointId);

        if (vendorId) {
          try {
            const csmsBase = process.env.CSMS_API_URL || 'http://127.0.0.1:3000';
            const statusResponse = await axios.get(
              `${csmsBase}/api/internal/vendors/${vendorId}/status`,
              {
                headers: {
                  Authorization: `Bearer ${process.env.SERVICE_TOKEN || 'your-service-token-change-in-production'}`,
                },
                timeout: 5000,
              },
            );

            const vendorStatus = statusResponse.data.status;

            if (vendorStatus === 'disabled') {
              logger.warn(`Connection rejected: Vendor ${vendorId} is disabled for charge point ${chargePointId}`);
              await ConnectionLogger.logConnectionFailure(
                chargePointId,
                'VENDOR_DISABLED',
                `Vendor ${vendorId} is disabled`,
                4003,
                'vendor_disabled',
                vendorId,
                { ipAddress, userAgent },
              );
              ws.close(4003, 'vendor_disabled');
              return;
            }

            if (vendorStatus === 'suspended') {
              logger.warn(`Connection accepted but vendor ${vendorId} is suspended for charge point ${chargePointId}`);
            }

            connectionManager.addConnection(chargePointId, ws, vendorId);

            await ConnectionLogger.logConnectionSuccess(chargePointId, vendorId, {
              ipAddress,
              userAgent,
            });
          } catch (error: any) {
            logger.error(`Error checking vendor status for ${chargePointId}:`, error.message);
            await ConnectionLogger.logError(
              chargePointId,
              'VENDOR_STATUS_CHECK_FAILED',
              `Error checking vendor status: ${error.message}`,
              vendorId,
              { ipAddress, userAgent },
            );
            connectionManager.addConnection(chargePointId, ws);
            vendorResolver.resolveVendorId(chargePointId).then((resolvedVendorId) => {
              if (resolvedVendorId) {
                connectionManager.setVendorId(chargePointId, resolvedVendorId);
              }
            });
            await ConnectionLogger.logConnectionSuccess(chargePointId, vendorId, {
              ipAddress,
              userAgent,
              warning: 'Vendor status check failed',
            });
          }
        } else {
          connectionManager.addConnection(chargePointId, ws);
          await ConnectionLogger.logConnectionSuccess(chargePointId, undefined, {
            ipAddress,
            userAgent,
            note: 'No vendor resolved',
          });
        }
      } catch (error: any) {
        logger.error(`Error resolving vendor for ${chargePointId}:`, error.message);
        await ConnectionLogger.logError(
          chargePointId,
          'VENDOR_RESOLUTION_FAILED',
          `Error resolving vendor: ${error.message}`,
          undefined,
          { ipAddress, userAgent },
        );
        connectionManager.addConnection(chargePointId, ws);
        await ConnectionLogger.logConnectionSuccess(chargePointId, undefined, {
          ipAddress,
          userAgent,
          warning: 'Vendor resolution failed',
        });
      }
    }

    ws.on('message', async (data: Buffer) => {
      const rawMessage = data.toString();

      try {
        const currentChargePointId = chargePointId || connectionManager.getChargePointId(ws);

        if (!currentChargePointId) {
          logger.warn('Received message but charge point ID is unknown');
          sendError(ws, 'PROTOCOL_ERROR', 'Charge point ID not yet identified');
          return;
        }

        if (LOG_RAW_FRAMES) {
          logger.debug(`Raw OCPP message from ${currentChargePointId}: ${rawMessage}`);
        }

        const message = JSON.parse(rawMessage);
        messageRouter.route(currentChargePointId, message, ws);
      } catch (error: any) {
        const currentChargePointId = chargePointId || connectionManager.getChargePointId(ws);
        if (currentChargePointId) {
          logger.error(`Error processing message from ${currentChargePointId}:`, error);
          const connection = connectionManager.getConnection(currentChargePointId);
          await ConnectionLogger.logMessageError(
            currentChargePointId,
            'FORMAT_VIOLATION',
            `Invalid JSON format: ${error.message}`,
            rawMessage,
            connection?.vendorId,
          );
        } else {
          logger.error(`Error processing message from unknown charge point:`, error);
        }
        sendError(ws, 'FORMAT_VIOLATION', 'Invalid JSON format');
      }
    });

    ws.on('close', async (code: number, reason: Buffer) => {
      const currentChargePointId = chargePointId || connectionManager.getChargePointId(ws);
      if (currentChargePointId) {
        logger.info(
          `WebSocket connection closed for charge point: ${currentChargePointId} (code: ${code}, reason: ${reason.toString()})`,
        );
        const connection = connectionManager.getConnection(currentChargePointId);
        await ConnectionLogger.logConnectionClosed(
          currentChargePointId,
          code,
          reason.toString(),
          connection?.vendorId,
        );
        commandManager.clearPending(currentChargePointId);
      }
      connectionManager.removeConnectionByWebSocket(ws);
    });

    ws.on('error', async (error: Error) => {
      const currentChargePointId = chargePointId || connectionManager.getChargePointId(ws);
      if (currentChargePointId) {
        logger.error(`WebSocket error for charge point ${currentChargePointId}:`, error);
        const connection = connectionManager.getConnection(currentChargePointId);
        await ConnectionLogger.logError(
          currentChargePointId,
          'WEBSOCKET_ERROR',
          error.message,
          connection?.vendorId,
          { stack: error.stack },
        );
      } else {
        logger.error(`WebSocket error for unknown charge point:`, error);
      }
    });
  });

  logger.info('Merged OCPP gateway: WebSocket /ocpp and HTTP /command mounted on CSMS API server');

  const shutdown = async () => {
    await new Promise<void>((resolve) => {
      wss.close(() => resolve());
    });
    redisSubscriber?.disconnect();
  };

  return { shutdown };
}
