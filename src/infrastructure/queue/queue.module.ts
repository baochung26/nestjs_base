import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisConfig } from '../../config/configuration';
import { QueueService } from './queue.service';
import {
  DefaultQueueProcessor,
  EmailQueueProcessor,
  NotificationQueueProcessor,
} from './queue.processor';
import { QueueController } from './queue.controller';

@Module({
  imports: [
    ConfigModule.forFeature(redisConfig),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redis = configService.get('redis');
        return {
          redis: {
            host: redis?.host || process.env.REDIS_HOST || 'localhost',
            port: redis?.port || parseInt(process.env.REDIS_PORT || '6379', 10),
            password: redis?.password || process.env.REDIS_PASSWORD || '',
            db: redis?.db || parseInt(process.env.REDIS_DB || '0', 10),
          },
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: true,
            removeOnFail: false,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'default',
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
    BullModule.registerQueue({
      name: 'notification',
    }),
  ],
  controllers: [QueueController],
  providers: [
    QueueService,
    DefaultQueueProcessor,
    EmailQueueProcessor,
    NotificationQueueProcessor,
  ],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
