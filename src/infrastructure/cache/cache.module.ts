import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisConfig } from '../../config/configuration';
import { CacheService } from './cache.service';
import { CacheInterceptor } from '../../common/interceptors/cache.interceptor';
import { redisStore } from 'cache-manager-redis-yet';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(redisConfig),
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redis = configService.get('redis');
        const isDevelopment = configService.get('app.env') !== 'production';

        return {
          store: await redisStore({
            socket: {
              host: redis?.host || process.env.REDIS_HOST || 'localhost',
              port: redis?.port || parseInt(process.env.REDIS_PORT || '6379', 10),
            },
            password: redis?.password || process.env.REDIS_PASSWORD || '',
            database: redis?.db || parseInt(process.env.REDIS_DB || '0', 10),
            ttl: 3600, // Default TTL: 1 hour
          }),
          ttl: 3600, // Default TTL: 1 hour
          max: 1000, // Maximum number of items in cache
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService, CacheInterceptor],
  exports: [NestCacheModule, CacheService, CacheInterceptor],
})
export class CacheModule {}
