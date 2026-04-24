import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { setupMergedOcppGateway } from './ocpp/ocpp-gateway.bootstrap';
import { collectAllowedOrigins, isBrowserOriginAllowed } from './common/cors-origins';

function isSwaggerEnabled(): boolean {
  const env = (process.env.ENABLE_SWAGGER || '').toLowerCase();
  if (env === 'true' || env === '1') return true;
  if (env === 'false' || env === '0') return false;
  return process.env.NODE_ENV !== 'production';
}

function enforceRequiredEnvInProduction() {
  if (process.env.NODE_ENV !== 'production') return;
  const required = ['JWT_SECRET', 'SERVICE_TOKEN'];
  const missing = required.filter((k) => !process.env[k] || !String(process.env[k]).trim());
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
  const jwtSecret = String(process.env.JWT_SECRET || '');
  const serviceToken = String(process.env.SERVICE_TOKEN || '');
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }
  if (serviceToken.length < 32) {
    throw new Error('SERVICE_TOKEN must be at least 32 characters in production');
  }
}

async function bootstrap() {
  enforceRequiredEnvInProduction();
  const port = Number(process.env.PORT || 3000);
  const swaggerEnabled = isSwaggerEnabled();
  // OCPP handlers call the CSMS REST API; same process → loopback (avoids hairpin TLS to public URL).
  if (!process.env.CSMS_API_URL) {
    process.env.CSMS_API_URL = `http://127.0.0.1:${port}`;
  }

  const app = await NestFactory.create(AppModule);
  setupMergedOcppGateway(app);
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1200,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Optional HTTP logging for Render/debug: set LOG_HTTP_REQUESTS=all to log every request;
  // otherwise only 4xx/5xx are logged (low noise).
  const httpLogger = new Logger('HTTP');
  const logHttpMode = (process.env.LOG_HTTP_REQUESTS || '').toLowerCase();
  const logAllHttp = logHttpMode === 'true' || logHttpMode === 'all';
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      const code = res.statusCode;
      if (logAllHttp || code >= 400) {
        const path = req.originalUrl || req.url || '';
        httpLogger.log(`${req.method} ${path} ${code} ${ms}ms`);
      }
    });
    next();
  });

  app.enableCors({
    // Recompute on each request so .env and CORS_* are current (same idea as WebSocket CORS).
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOrigins = collectAllowedOrigins();
      if (isBrowserOriginAllowed(origin, allowedOrigins)) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      // Use (null, false) so the response is a normal 403-style CORS block, not an uncaught error
      // that can omit Access-Control-* headers on some stacks.
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    // Omit allowedHeaders: let the `cors` package echo Access-Control-Request-Headers on preflight
    // so browsers are not blocked when axios sends Cache-Control, Pragma, or custom keys.
    maxAge: 86400,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Root endpoint (before API prefix)
  app.getHttpAdapter().get('/', (req, res) => {
    res.status(200).json({
      message: 'Clean Motion Ghana - CSMS API - Central System Management System',
      version: '1.0',
      endpoints: {
        health: '/health',
        api: '/api',
        docs: swaggerEnabled ? '/api/docs' : 'Swagger docs disabled (set ENABLE_SWAGGER=true to enable in production)',
        ocpp: 'OCPP 1.6J WebSocket on /ocpp (or /ocpp/{chargePointId}); production: wss://<public host>/ocpp (same host as the web app if nginx proxies, or the API host if exposed directly with WS upgrade).',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Health check endpoint (before API prefix)
  app.getHttpAdapter().get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger: on by default except production; override with ENABLE_SWAGGER=true|false
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('CSMS API')
      .setDescription('Clean Motion Ghana - Central System Management System API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Health check endpoint with API prefix (for consistency)
  app.getHttpAdapter().get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  await app.listen(port, '0.0.0.0');
  console.log(`CSMS API + OCPP (/ocpp) on: http://0.0.0.0:${port}`);
  if (swaggerEnabled) {
    console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
  }
}

bootstrap();

