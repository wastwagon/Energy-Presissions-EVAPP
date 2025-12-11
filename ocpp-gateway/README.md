# OCPP Gateway
## OCPP 1.6J WebSocket Server for EV Charging Billing System

This service handles WebSocket connections from EV charging stations and processes OCPP 1.6J messages.

## Features

- ✅ WebSocket server for OCPP 1.6J connections
- ✅ Connection management for multiple charge points
- ✅ Message routing and handling
- ✅ OCPP message handlers:
  - BootNotification
  - Heartbeat
  - StatusNotification
  - Authorize
  - StartTransaction
  - MeterValues
  - StopTransaction
- ✅ Communication with CSMS API
- ✅ Structured logging
- ✅ Error handling

## Project Structure

```
ocpp-gateway/
├── src/
│   ├── handlers/          # OCPP message handlers
│   │   ├── boot-notification.ts
│   │   ├── heartbeat.ts
│   │   ├── status-notification.ts
│   │   ├── authorize.ts
│   │   ├── start-transaction.ts
│   │   ├── meter-values.ts
│   │   └── stop-transaction.ts
│   ├── services/          # Core services
│   │   ├── connection-manager.ts
│   │   └── message-router.ts
│   ├── types/             # TypeScript types
│   │   └── ocpp-message.ts
│   ├── utils/             # Utilities
│   │   └── logger.ts
│   └── index.ts           # Entry point
├── package.json
├── tsconfig.json
├── Dockerfile.dev
└── README.md
```

## Environment Variables

- `PORT` - WebSocket server port (default: 9000)
- `REDIS_URL` - Redis connection URL
- `CSMS_API_URL` - CSMS API base URL
- `SERVICE_TOKEN` - Service authentication token
- `LOG_RAW_FRAMES` - Log raw OCPP messages (default: true)
- `LOG_LEVEL` - Logging level (default: info)

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Start production
npm start
```

## WebSocket Endpoint

- **URL**: `ws://localhost:9000/ocpp/{chargePointId}`
- **Protocol**: OCPP 1.6J (JSON-RPC 2.0)

## Health Check

- **Endpoint**: `http://localhost:9000/health`
- **Response**: `200 OK` if healthy

## Next Steps

- [ ] Implement outgoing commands (RemoteStartTransaction, RemoteStopTransaction, etc.)
- [ ] Add command queue for offline charge points
- [ ] Implement reconnection handling
- [ ] Add metrics and monitoring
- [ ] Add unit tests



