import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { setupMergedOcppGateway } from './ocpp/ocpp-gateway.bootstrap';
import { collectAllowedOrigins, isBrowserOriginAllowed } from './common/cors-origins';

async function bootstrap() {
  const port = Number(process.env.PORT || 3000);
  // OCPP handlers call the CSMS REST API; same process → loopback (avoids hairpin TLS to public URL).
  if (!process.env.CSMS_API_URL) {
    process.env.CSMS_API_URL = `http://127.0.0.1:${port}`;
  }

  const app = await NestFactory.create(AppModule);
  setupMergedOcppGateway(app);

  const allowedOrigins = collectAllowedOrigins();

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
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
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Vendor-Id',
      'Accept',
      'Accept-Language',
      'Origin',
      'X-Requested-With',
    ],
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
        docs: process.env.NODE_ENV !== 'production' ? '/api/docs' : 'Swagger docs disabled in production',
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

  // Swagger documentation (enable in production for API exploration)
  const config = new DocumentBuilder()
    .setTitle('CSMS API')
    .setDescription('Clean Motion Ghana - Central System Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Health check endpoint with API prefix (for consistency)
  app.getHttpAdapter().get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  await app.listen(port, '0.0.0.0');
  console.log(`CSMS API + OCPP (/ocpp) on: http://0.0.0.0:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();

