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
import { BullBoardSetupService, BULL_BOARD_DEFAULT_PATH } from './infrastructure/queue/bull-board';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);

  app.use(getHelmetConfig(configService));
  app.enableCors(getCorsConfig(configService));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: createValidationExceptionFactory(),
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor(app.get(Logger)));
  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalFilters(new HttpExceptionFilter());

  const appConfig = configService.get('app');
  const prefix = appConfig?.prefix ?? 'api';
  const bullBoardPath = configService.get('bullBoard.path') ?? BULL_BOARD_DEFAULT_PATH;

  app.setGlobalPrefix(prefix, {
    exclude: [bullBoardPath, `${bullBoardPath}/(.*)`],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Bull Board UI - mount (dev only, auth + router)
  const bullBoardSetup = app.get(BullBoardSetupService);
  const bullBoardMounted = bullBoardSetup.mount(app);

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
    if (bullBoardMounted) {
      logger.log(`Bull Board (Queue Monitor): http://localhost:${port}${bullBoardSetup.getPath()}`);
    }
  }
}
bootstrap();
