import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      credentials: true,
    },
  });

  // Enable CORS for both web and mobile apps
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    process.env.MOBILE_API_URL || 'http://localhost:3000',
    // Add production URLs when deploying
    // 'https://your-web-domain.com',
    // 'https://your-api-domain.com',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Vendor-Id'],
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

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`CSMS API is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();

