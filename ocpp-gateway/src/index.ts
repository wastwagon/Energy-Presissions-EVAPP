import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import axios from 'axios';
import { logger } from './utils/logger';
import { ConnectionManager } from './services/connection-manager';
import { CommandManager } from './services/command-manager';
import { MessageRouter } from './services/message-router';
import { TenantResolver } from './services/tenant-resolver';
import { ConnectionLogger } from './services/connection-logger';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '9000', 10);
const LOG_RAW_FRAMES = process.env.LOG_RAW_FRAMES === 'true';

// Create HTTP server for health checks and command API
const server = createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // Connection status endpoint
  if (req.url?.startsWith('/health/connection/') && req.method === 'GET') {
    const chargePointId = req.url.split('/')[3];
    const isConnected = connectionManager.isConnected(chargePointId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ connected: isConnected }));
    return;
  }

  // Command endpoint for CSMS API
  if (req.url?.startsWith('/command/') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const command = JSON.parse(body);
        const chargePointId = req.url?.split('/')[2];
        
        if (!chargePointId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Charge point ID required' }));
          return;
        }

        // Extract message ID and action from command
        const message = command.message;
        if (!Array.isArray(message) || message.length < 3) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid OCPP message format' }));
          return;
        }

        const messageId = message[1] as string;
        const action = message[2] as string;

        // Register pending command
        const responsePromise = commandManager.registerCommand(
          messageId,
          action,
          chargePointId,
        );

        // Send command to charge point
        const success = connectionManager.sendMessage(chargePointId, message);
        
        if (!success) {
          commandManager.clearPending(chargePointId);
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Charge point not connected' }));
          return;
        }

        // Wait for response (with timeout)
        try {
          const response = await responsePromise;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: true, 
            message: 'Command sent',
            response 
          }));
        } catch (error: any) {
          res.writeHead(504, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Command timeout or error',
            message: error.message 
          }));
        }
      } catch (error: any) {
        logger.error('Error processing command:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid command format', message: error.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  path: '/ocpp'
});

// Initialize services
const connectionManager = new ConnectionManager();
const commandManager = new CommandManager();
const messageRouter = new MessageRouter(connectionManager, commandManager);
const tenantResolver = new TenantResolver();

// Initialize Redis for tenant status pub/sub
const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
const redisSubscriber = new Redis(redisUrl);
const TENANT_STATUS_CHANNEL = 'tenant.status.changed';

// Subscribe to tenant status changes
redisSubscriber.subscribe(TENANT_STATUS_CHANNEL);
redisSubscriber.on('message', (channel, message) => {
  if (channel === TENANT_STATUS_CHANNEL) {
    try {
      const payload = JSON.parse(message);
      handleTenantStatusChange(payload);
    } catch (error) {
      logger.error('Error parsing tenant status change message:', error);
    }
  }
});

// Handle tenant status changes
async function handleTenantStatusChange(payload: {
  tenantId: number;
  status: 'active' | 'suspended' | 'disabled';
  reason?: string;
  at: string;
}) {
  logger.info(`Tenant status changed: ${payload.tenantId} -> ${payload.status}`);

  if (payload.status === 'disabled') {
    // Close all connections for disabled tenant
    connectionManager.closeTenantConnections(
      payload.tenantId,
      4003, // Custom close code for tenant_disabled
      'tenant_disabled',
    );
  } else if (payload.status === 'suspended') {
    // Option A: Close connections with suspended code
    // Option B: Keep connections but block commands (implemented in command handler)
    // For now, we'll close connections to be safe
    connectionManager.closeTenantConnections(
      payload.tenantId,
      4002, // Custom close code for tenant_suspended
      'tenant_suspended',
    );
  }

  // Clear tenant cache
  const connections = connectionManager.getConnectionsByTenant(payload.tenantId);
  for (const conn of connections) {
    tenantResolver.clearCache(conn.chargePointId);
  }
}

// Handle WebSocket connections
wss.on('connection', async (ws, req) => {
  const urlString = req.url || '';
  const url = urlString.startsWith('http') 
    ? new URL(urlString)
    : new URL(urlString, `http://${req.headers.host || 'localhost'}`);
  const chargePointId = extractChargePointId(url.pathname);
  
  if (!chargePointId) {
    logger.warn('Connection rejected: No charge point ID in URL');
    const ipAddress = req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    await ConnectionLogger.logConnectionFailure(
      'UNKNOWN',
      'MISSING_CHARGE_POINT_ID',
      'No charge point ID in URL',
      1008,
      'Charge point ID required',
      undefined,
      { ipAddress, userAgent, requestUrl: req.url },
    );
    ws.close(1008, 'Charge point ID required');
    return;
  }

  logger.info(`New WebSocket connection from charge point: ${chargePointId}`);
  
  // Log connection attempt
  const ipAddress = req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  await ConnectionLogger.logConnectionAttempt(chargePointId, ipAddress, userAgent, req.url);
  
  // Resolve tenant and check status before accepting connection
  try {
    const tenantId = await tenantResolver.resolveTenantId(chargePointId);
    
    if (tenantId) {
      // Check tenant status via CSMS API
      try {
        const statusResponse = await axios.get(
          `${process.env.CSMS_API_URL || 'http://csms-api:3000'}/api/internal/tenants/${tenantId}/status`,
          {
            headers: {
              Authorization: `Bearer ${process.env.SERVICE_TOKEN || 'your-service-token-change-in-production'}`,
            },
            timeout: 5000,
          },
        );

        const tenantStatus = statusResponse.data.status;

        if (tenantStatus === 'disabled') {
          logger.warn(`Connection rejected: Tenant ${tenantId} is disabled for charge point ${chargePointId}`);
          await ConnectionLogger.logConnectionFailure(
            chargePointId,
            'TENANT_DISABLED',
            `Tenant ${tenantId} is disabled`,
            4003,
            'tenant_disabled',
            tenantId,
            { ipAddress, userAgent },
          );
          ws.close(4003, 'tenant_disabled');
          return;
        }

        if (tenantStatus === 'suspended') {
          logger.warn(`Connection accepted but tenant ${tenantId} is suspended for charge point ${chargePointId}`);
          // Allow connection but commands will be blocked
        }

        // Register connection with tenantId
        connectionManager.addConnection(chargePointId, ws, tenantId);
        
        // Log successful connection
        await ConnectionLogger.logConnectionSuccess(chargePointId, tenantId, {
          ipAddress,
          userAgent,
        });
      } catch (error: any) {
        logger.error(`Error checking tenant status for ${chargePointId}:`, error.message);
        await ConnectionLogger.logError(
          chargePointId,
          'TENANT_STATUS_CHECK_FAILED',
          `Error checking tenant status: ${error.message}`,
          tenantId,
          { ipAddress, userAgent },
        );
        // If status check fails, allow connection but log warning
        connectionManager.addConnection(chargePointId, ws);
        // Try to resolve tenantId asynchronously
        tenantResolver.resolveTenantId(chargePointId).then((resolvedTenantId) => {
          if (resolvedTenantId) {
            connectionManager.setTenantId(chargePointId, resolvedTenantId);
          }
        });
        // Log connection success despite tenant check failure
        await ConnectionLogger.logConnectionSuccess(chargePointId, tenantId, {
          ipAddress,
          userAgent,
          warning: 'Tenant status check failed',
        });
      }
    } else {
      // No tenant resolved, register without tenantId (backward compatibility)
      connectionManager.addConnection(chargePointId, ws);
      await ConnectionLogger.logConnectionSuccess(chargePointId, undefined, {
        ipAddress,
        userAgent,
        note: 'No tenant resolved',
      });
    }
  } catch (error: any) {
    logger.error(`Error resolving tenant for ${chargePointId}:`, error.message);
    await ConnectionLogger.logError(
      chargePointId,
      'TENANT_RESOLUTION_FAILED',
      `Error resolving tenant: ${error.message}`,
      undefined,
      { ipAddress, userAgent },
    );
    // Allow connection even if tenant resolution fails (backward compatibility)
    connectionManager.addConnection(chargePointId, ws);
    await ConnectionLogger.logConnectionSuccess(chargePointId, undefined, {
      ipAddress,
      userAgent,
      warning: 'Tenant resolution failed',
    });
  }
  
  // Handle messages
  ws.on('message', async (data: Buffer) => {
    const rawMessage = data.toString();
    
    try {
      if (LOG_RAW_FRAMES) {
        logger.debug(`Raw OCPP message from ${chargePointId}: ${rawMessage}`);
      }
      
      const message = JSON.parse(rawMessage);
      messageRouter.route(chargePointId, message);
    } catch (error: any) {
      logger.error(`Error processing message from ${chargePointId}:`, error);
      // Log message error
      const connection = connectionManager.getConnection(chargePointId);
      await ConnectionLogger.logMessageError(
        chargePointId,
        'FORMAT_VIOLATION',
        `Invalid JSON format: ${error.message}`,
        rawMessage,
        connection?.tenantId,
      );
      // Send OCPP error response
      sendError(ws, 'FORMAT_VIOLATION', 'Invalid JSON format');
    }
  });
  
  // Handle close
  ws.on('close', async (code: number, reason: Buffer) => {
    logger.info(`WebSocket connection closed for charge point: ${chargePointId} (code: ${code}, reason: ${reason.toString()})`);
    const connection = connectionManager.getConnection(chargePointId);
    await ConnectionLogger.logConnectionClosed(
      chargePointId,
      code,
      reason.toString(),
      connection?.tenantId,
    );
    commandManager.clearPending(chargePointId);
    connectionManager.removeConnection(chargePointId);
  });
  
  // Handle errors
  ws.on('error', async (error: Error) => {
    logger.error(`WebSocket error for charge point ${chargePointId}:`, error);
    const connection = connectionManager.getConnection(chargePointId);
    await ConnectionLogger.logError(
      chargePointId,
      'WEBSOCKET_ERROR',
      error.message,
      connection?.tenantId,
      { stack: error.stack },
    );
  });
});

// Extract charge point ID from URL path
function extractChargePointId(pathname: string): string | null {
  // Expected format: /ocpp/{chargePointId}
  const parts = pathname.split('/').filter(p => p);
  if (parts.length >= 2 && parts[0] === 'ocpp') {
    return parts[1];
  }
  return null;
}

// Send OCPP error response
function sendError(ws: any, errorCode: string, errorDescription: string) {
  const errorResponse = [
    4, // CALLERROR
    null, // Message ID (unknown)
    errorCode,
    errorDescription,
    {}
  ];
  
  try {
    ws.send(JSON.stringify(errorResponse));
  } catch (error) {
    logger.error('Error sending error response:', error);
  }
}

// Start server
server.listen(PORT, () => {
  logger.info(`OCPP Gateway WebSocket server listening on port ${PORT}`);
  logger.info(`WebSocket endpoint: ws://localhost:${PORT}/ocpp/{chargePointId}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  wss.close(() => {
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
});

