import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig, {
  databaseConfig,
  redisConfig,
  jwtConfig,
  googleOAuthConfig,
} from './config/configuration';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { SeederModule } from './infrastructure/database/seed/seeder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig, redisConfig, jwtConfig, googleOAuthConfig],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    AdminModule,
    QueueModule,
    SeederModule,
  ],
})
export class AppModule {}

