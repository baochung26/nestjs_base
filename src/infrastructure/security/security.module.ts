import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisConfig } from '../../config/configuration';

@Module({
  imports: [
    ConfigModule.forFeature(redisConfig),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => {
        return {
          throttlers: [
            {
              name: 'default',
              ttl: 60000, // 1 minute
              limit: 100, // 100 requests per minute
            },
            {
              name: 'short',
              ttl: 10000, // 10 seconds
              limit: 10, // 10 requests per 10 seconds
            },
            {
              name: 'long',
              ttl: 600000, // 10 minutes
              limit: 1000, // 1000 requests per 10 minutes
            },
          ],
        };
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [ThrottlerModule],
})
export class SecurityModule {}
