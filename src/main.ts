import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix for REST API
  app.setGlobalPrefix('api/v1');

  // Enable CORS for Vanilla JS / SPA clients (supporting Live Server, local files, and dev hosts)
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or local files) or any localhost/127.0.0.1
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || origin === process.env.CORS_ORIGIN) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev mode for smooth frontend integration
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
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
      'Property Rental & Real Estate Marketplace API documentation. Supports Property Seekers, Landlords, Agents, Property Managers, and Administrators.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 5000;
  await app.listen(port);

  logger.log(`HAVENHUB Backend running on: http://localhost:${port}/api/v1`);
  logger.log(`Swagger API Docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
