import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { Request, Response } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix for REST API
  app.setGlobalPrefix('api/v1');

  // Enable CORS for Vanilla JS / Mobile / SPA clients
  app.enableCors({
    origin: (origin, callback) => {
      callback(null, true); // Permissive CORS for staging API access
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-user-id'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Global pipes & filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('HAVENHUB REST API')
    .setDescription(
      'HAVENHUB Property Rental & Real Estate Marketplace Backend API.\n\n' +
        '**Base URL**: `/api/v1`  \n' +
        '**Authentication**: Bearer JWT (`Authorization: Bearer <token>`)  \n' +
        '**Roles**: `PROPERTY_SEEKER`, `LANDLORD`, `REAL_ESTATE_AGENT`, `PROPERTY_MANAGER`, `ADMIN`',
    )
    .setVersion('1.0.0')
    .addTag('Health Check', 'System health status and database connectivity monitoring')
    .addTag('Auth', 'User registration, login, JWT token management, and profile')
    .addTag('Properties', 'Public discovery feed, search filtering, and property details')
    .addTag('Enquiries', 'Renter inquiry submission and messaging threads')
    .addTag('Admin', 'Administrator moderation queue and audit logs')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Paste your raw JWT token ONLY (do NOT type "Bearer")',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
    },
    customSiteTitle: 'HAVENHUB API Documentation',
  });

  // Explicit JSON endpoint for Flutter code generators (swagger_parser / openapi_generator)
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/docs-json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(document);
  });

  const port = process.env.PORT || 5000;
  // Bind explicitly to 0.0.0.0 for cloud container proxies (Render / Railway / Docker)
  await app.listen(port, '0.0.0.0');

  logger.log(`HAVENHUB Backend running on: http://0.0.0.0:${port}/api/v1`);
  logger.log(`Swagger API Docs available at: http://0.0.0.0:${port}/api/docs`);
  logger.log(`Flutter OpenAPI Spec JSON available at: http://0.0.0.0:${port}/api/docs-json`);
}

bootstrap();
