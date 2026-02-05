import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(
    private configService: ConfigService,
    @InjectQueue('email') private emailQueue: Queue,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Test Redis connection by pinging through queue client
      const redisClient = this.emailQueue.client;
      const result = await redisClient.ping();

      if (result === 'PONG') {
        return this.getStatus(key, true, {
          message: 'Redis is healthy',
          status: 'up',
        });
      }

      throw new Error('Redis ping failed');
    } catch (error: any) {
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false, {
          message: error.message || 'Redis connection failed',
          status: 'down',
        }),
      );
    }
  }
}
