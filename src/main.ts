import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { createValidationExceptionFactory } from './config/validation';
import { Logger } from 'nestjs-pino';
import { getHelmetConfig, getCorsConfig } from './infrastructure/security/security.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use Pino logger
  app.useLogger(app.get(Logger));

  // Get ConfigService
  const configService = app.get(ConfigService);

  // Security: Helmet
  app.use(getHelmetConfig(configService));

  // Security: CORS
  app.enableCors(getCorsConfig(configService));

  // Global validation pipe with custom exception
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: createValidationExceptionFactory(),
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(app.get(Logger)));
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global exception filters - Handle all exceptions
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global prefix + API Versioning (URI-based: /api/v1)
  const configServiceAgain = app.get(ConfigService);
  const appConfig = configServiceAgain.get('app');
  const prefix = appConfig?.prefix || 'api';

  app.setGlobalPrefix(prefix);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Swagger/OpenAPI Documentation
  const isDevelopment = configService.get('app.env') !== 'production';
  if (isDevelopment) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('NestJS Demo API')
      .setDescription('API documentation for NestJS Demo application')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('App', 'Application information')
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management endpoints')
      .addTag('admin', 'Admin endpoints')
      .addTag('health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${prefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  // Port đã được config trong appConfig (từ configuration.ts)
  const port = appConfig?.port || 3000;
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`Application is running on: http://localhost:${port}/${prefix}/v1`);
  if (configService.get('app.env') !== 'production') {
    logger.log(`Swagger documentation: http://localhost:${port}/${prefix}/docs`);
  }
}
bootstrap();
