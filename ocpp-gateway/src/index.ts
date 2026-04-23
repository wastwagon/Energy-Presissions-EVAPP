import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import axios from 'axios';
import { logger } from './utils/logger';
import { ConnectionManager } from './services/connection-manager';
import { CommandManager } from './services/command-manager';
import { MessageRouter } from './services/message-router';
import { VendorResolver } from './services/vendor-resolver';
import { ConnectionLogger } from './services/connection-logger';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '9000', 10);
const LOG_RAW_FRAMES = process.env.LOG_RAW_FRAMES === 'true';

// Create HTTP server for health checks and command API
const server = createServer((req, res) => {
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
// Note: We don't specify path here to allow both /ocpp and /ocpp/
// Path validation is done in the connection handler
const wss = new WebSocketServer({ 
  server
});

// Initialize services
const connectionManager = new ConnectionManager();
const commandManager = new CommandManager();
const messageRouter = new MessageRouter(connectionManager, commandManager);
const vendorResolver = new VendorResolver();

// Initialize Redis for vendor status pub/sub
const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
const redisSubscriber = new Redis(redisUrl);
const VENDOR_STATUS_CHANNEL = 'vendor.status.changed';

// Subscribe to vendor status changes
redisSubscriber.subscribe(VENDOR_STATUS_CHANNEL);
redisSubscriber.on('message', (channel, message) => {
  if (channel === VENDOR_STATUS_CHANNEL) {
    try {
      const payload = JSON.parse(message);
      handleVendorStatusChange(payload);
    } catch (error) {
      logger.error('Error parsing vendor status change message:', error);
    }
  }
});

// Handle vendor status changes
async function handleVendorStatusChange(payload: {
  vendorId: number;
  status: 'active' | 'suspended' | 'disabled';
  reason?: string;
  at: string;
}) {
  logger.info(`Vendor status changed: ${payload.vendorId} -> ${payload.status}`);

  if (payload.status === 'disabled') {
    // Close all connections for disabled vendor
    connectionManager.closeVendorConnections(
      payload.vendorId,
      4003, // Custom close code for vendor_disabled
      'vendor_disabled',
    );
  } else if (payload.status === 'suspended') {
    // Option A: Close connections with suspended code
    // Option B: Keep connections but block commands (implemented in command handler)
    // For now, we'll close connections to be safe
    connectionManager.closeVendorConnections(
      payload.vendorId,
      4002, // Custom close code for vendor_suspended
      'vendor_suspended',
    );
  }

  // Clear vendor cache
  const connections = connectionManager.getConnectionsByVendor(payload.vendorId);
  for (const conn of connections) {
    vendorResolver.clearCache(conn.chargePointId);
  }
}

// Handle WebSocket connections
wss.on('connection', async (ws, req) => {
  const urlString = req.url || '';
  const url = urlString.startsWith('http') 
    ? new URL(urlString)
    : new URL(urlString, `http://${req.headers.host || 'localhost'}`);
  const chargePointId = extractChargePointId(url.pathname);
  
  const ipAddress = req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  // Validate path - accept:
  // - /ocpp (no ID, will extract from BootNotification)
  // - /ocpp/ (no ID, with trailing slash)
  // - /ocpp/{chargePointId} (with ID in URL - legacy format, also supported)
  const pathParts = url.pathname.split('/').filter(p => p);
  const isValidPath = 
    (pathParts.length === 1 && pathParts[0] === 'ocpp') ||           // /ocpp
    (pathParts.length === 0 && url.pathname === '/ocpp/') ||          // /ocpp/
    (pathParts.length === 2 && pathParts[0] === 'ocpp' && pathParts[1]); // /ocpp/{chargePointId}
  
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

  // If charge point ID is not in URL, create temporary connection
  // Charge point ID will be extracted from BootNotification message
  if (!chargePointId) {
    // Create temporary connection - will be mapped when BootNotification arrives
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    connectionManager.addTemporaryConnection(ws, tempId);
    logger.info(`Temporary connection established (waiting for BootNotification): ${tempId} from ${ipAddress}`);
    await ConnectionLogger.logConnectionAttempt(tempId, ipAddress, userAgent, req.url);
  } else {
    logger.info(`New WebSocket connection from charge point: ${chargePointId}`);
    await ConnectionLogger.logConnectionAttempt(chargePointId, ipAddress, userAgent, req.url);
  }
  
  // Only resolve vendor if charge point ID is already known (from URL)
  // For temporary connections, vendor will be resolved after BootNotification
  if (chargePointId) {
    // Resolve vendor and check status before accepting connection
    try {
      const vendorId = await vendorResolver.resolveVendorId(chargePointId);
      
      if (vendorId) {
        // Check vendor status via CSMS API
        try {
          const statusResponse = await axios.get(
            `${process.env.CSMS_API_URL || 'http://csms-api:3000'}/api/internal/vendors/${vendorId}/status`,
            {
              headers: {
                Authorization: `Bearer ${process.env.SERVICE_TOKEN || ''}`,
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
            // Allow connection but commands will be blocked
          }

          // Register connection with vendorId
          connectionManager.addConnection(chargePointId, ws, vendorId);
          
          // Log successful connection
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
          // If status check fails, allow connection but log warning
          connectionManager.addConnection(chargePointId, ws);
          // Try to resolve vendorId asynchronously
          vendorResolver.resolveVendorId(chargePointId).then((resolvedVendorId) => {
            if (resolvedVendorId) {
              connectionManager.setVendorId(chargePointId, resolvedVendorId);
            }
          });
          // Log connection success despite vendor check failure
          await ConnectionLogger.logConnectionSuccess(chargePointId, vendorId, {
            ipAddress,
            userAgent,
            warning: 'Vendor status check failed',
          });
        }
      } else {
        // No vendor resolved, register without vendorId (backward compatibility)
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
      // Allow connection even if vendor resolution fails (backward compatibility)
      connectionManager.addConnection(chargePointId, ws);
      await ConnectionLogger.logConnectionSuccess(chargePointId, undefined, {
        ipAddress,
        userAgent,
        warning: 'Vendor resolution failed',
      });
    }
  }
  // For temporary connections (no chargePointId), we'll wait for BootNotification
  
  // Handle messages
  ws.on('message', async (data: Buffer) => {
    const rawMessage = data.toString();
    
    try {
      // Get charge point ID (may be temporary if not yet mapped)
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
        // Log message error
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
      // Send OCPP error response
      sendError(ws, 'FORMAT_VIOLATION', 'Invalid JSON format');
    }
  });
  
  // Handle close
  ws.on('close', async (code: number, reason: Buffer) => {
    const currentChargePointId = chargePointId || connectionManager.getChargePointId(ws);
    if (currentChargePointId) {
      logger.info(`WebSocket connection closed for charge point: ${currentChargePointId} (code: ${code}, reason: ${reason.toString()})`);
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
  
  // Handle errors
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

// Extract charge point ID from URL path
function extractChargePointId(pathname: string): string | null {
  // Expected format: /ocpp/{chargePointId} or /ocpp/ or /ocpp (without ID - will be extracted from BootNotification)
  // Handle both /ocpp and /ocpp/ (with or without trailing slash)
  const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const parts = normalizedPath.split('/').filter(p => p);
  
  if (parts.length >= 2 && parts[0] === 'ocpp') {
    return parts[1]; // Return charge point ID if present
  }
  // Return null if path is just /ocpp or /ocpp/ (without ID) - this is allowed
  if (parts.length === 1 && parts[0] === 'ocpp') {
    return null;
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

// Start server - bind to 0.0.0.0 to accept connections from network
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`OCPP Gateway WebSocket server listening on port ${PORT}`);
  logger.info(`WebSocket endpoint: ws://0.0.0.0:${PORT}/ocpp/ (charge point ID extracted from BootNotification)`);
  logger.info(`Also supports: ws://0.0.0.0:${PORT}/ocpp/{chargePointId} (legacy format)`);
  logger.info(`Accepting connections from network on port ${PORT}`);
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

