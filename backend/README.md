# CSMS API
## Central System Management System API for EV Charging Billing

NestJS-based REST API for managing EV charging operations, transactions, billing, and users.

## Features

- ✅ NestJS framework with TypeScript
- ✅ TypeORM for database access
- ✅ Entity models for all database tables
- ✅ Internal API for OCPP Gateway communication
- ✅ Service token authentication
- ✅ Swagger documentation
- ✅ Health check endpoint

## Project Structure

```
backend/
├── src/
│   ├── entities/          # TypeORM entities
│   ├── modules/           # Feature modules
│   │   ├── auth/
│   │   ├── users/
│   │   ├── charge-points/
│   │   ├── transactions/
│   │   ├── billing/
│   │   └── internal/      # Internal API for OCPP Gateway
│   ├── database/          # Database configuration
│   ├── common/            # Shared utilities
│   │   ├── guards/
│   │   ├── decorators/
│   │   └── filters/
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── main.ts
├── package.json
├── tsconfig.json
├── nest-cli.json
├── Dockerfile.dev
└── README.md
```

## Environment Variables

- `PORT` - API port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection URL
- `JWT_SECRET` - JWT secret for authentication
- `SERVICE_TOKEN` - Service token for internal API
- `MINIO_ENDPOINT` - MinIO endpoint
- `MINIO_ACCESS_KEY` - MinIO access key
- `MINIO_SECRET_KEY` - MinIO secret key
- `NODE_ENV` - Environment (development/production)

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Build
npm run build

# Start production
npm run start:prod
```

## API Endpoints

### Internal API (for OCPP Gateway)
- `POST /api/internal/charge-points` - Upsert charge point
- `POST /api/internal/charge-points/:id/status` - Update status
- `GET /api/internal/authorize/:idTag` - Authorize IdTag
- `POST /api/internal/transactions` - Create transaction
- `POST /api/internal/transactions/:id/stop` - Stop transaction
- `POST /api/internal/meter-values` - Store meter values

### Public API (TODO)
- Authentication endpoints
- User management
- Charge point management
- Transaction management
- Billing endpoints

## Swagger Documentation

When running in development mode:
- URL: `http://localhost:3000/api/docs`

## Health Check

- Endpoint: `http://localhost:3000/health`
- Response: `{ status: 'ok', timestamp: '...' }`

## Next Steps

- [ ] Implement authentication (JWT)
- [ ] Implement user management endpoints
- [ ] Implement charge point management endpoints
- [ ] Implement transaction management endpoints
- [ ] Implement billing logic
- [ ] Add unit tests
- [ ] Add integration tests



