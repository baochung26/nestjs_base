import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { createValidationExceptionFactory } from './config/validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors();

  // Global validation pipe with custom exception
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: createValidationExceptionFactory(),
    }),
  );

  // Global interceptors - Transform response to standard format
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global exception filters - Handle all exceptions
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global prefix
  const configService = app.get(ConfigService);
  const appConfig = configService.get('app');
  app.setGlobalPrefix(appConfig?.prefix || 'api');

  const port = appConfig?.port || parseInt(process.env.APP_PORT || '3000', 10);
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}/${appConfig?.prefix || 'api'}`);
}
bootstrap();
