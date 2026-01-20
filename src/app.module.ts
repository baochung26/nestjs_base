import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig, {
  databaseConfig,
  redisConfig,
  jwtConfig,
  googleOAuthConfig,
  mailConfig,
  storageConfig,
} from './config/configuration';
import { validationSchema, validationOptions } from './config/validation.schema';
import { DatabaseModule } from './infrastructure/database/database.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { MailModule } from './infrastructure/mail/mail.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { SchedulerModule } from './infrastructure/scheduler/scheduler.module';
import { HealthModule } from './infrastructure/health/health.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { SeederModule } from './infrastructure/database/seed/seeder.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig, redisConfig, jwtConfig, googleOAuthConfig, mailConfig, storageConfig],
      validationSchema,
      validationOptions,
    }),
    LoggerModule,
    DatabaseModule,
    CacheModule,
    MailModule,
    StorageModule,
    AuthModule,
    UsersModule,
    AdminModule,
    QueueModule,
    SchedulerModule,
    HealthModule,
    SecurityModule,
    SeederModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}

