import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueueService } from '../../queue/queue.service';
import { CacheService } from '../../cache/cache.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../modules/users/entities/user.entity';
import { QueueName } from '../../queue/queue.types';

@Injectable()
export class CleanupScheduler {
  private readonly logger = new Logger(CleanupScheduler.name);

  constructor(
    private queueService: QueueService,
    private cacheService: CacheService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Cleanup completed queue jobs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupCompletedJobs() {
    this.logger.log('Starting cleanup of completed queue jobs');

    try {
      const queues: QueueName[] = ['default', 'email', 'notification'];
      const grace = 3600000; // 1 hour

      for (const queueName of queues) {
        const cleaned = await this.queueService.cleanCompletedJobs(
          queueName,
          grace,
        );
        this.logger.log(
          `Cleaned ${cleaned.length} completed jobs from ${queueName} queue`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        { error: error.message },
        'Error cleaning up completed jobs',
      );
    }
  }

  /**
   * Cleanup failed queue jobs daily at 2 AM
   */
  @Cron('0 2 * * *')
  async cleanupFailedJobs() {
    this.logger.log('Starting cleanup of failed queue jobs');

    try {
      const queues: QueueName[] = ['default', 'email', 'notification'];
      const grace = 86400000; // 24 hours

      for (const queueName of queues) {
        const cleaned = await this.queueService.cleanFailedJobs(
          queueName,
          grace,
        );
        this.logger.log(
          `Cleaned ${cleaned.length} failed jobs from ${queueName} queue`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        { error: error.message },
        'Error cleaning up failed jobs',
      );
    }
  }

  /**
   * Cleanup old cache entries daily at 3 AM
   */
  @Cron('0 3 * * *')
  async cleanupCache() {
    this.logger.log('Starting cache cleanup');

    try {
      // This is a placeholder - actual cache cleanup depends on TTL
      // Redis will automatically expire keys based on TTL
      this.logger.log('Cache cleanup completed (TTL-based expiration)');
    } catch (error: any) {
      this.logger.error({ error: error.message }, 'Error cleaning up cache');
    }
  }

  /**
   * Cleanup inactive users monthly (1st day at 4 AM)
   */
  @Cron('0 4 1 * *')
  async cleanupInactiveUsers() {
    this.logger.log('Starting cleanup of inactive users');

    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const result = await this.userRepository
        .createQueryBuilder()
        .delete()
        .from(User)
        .where('isActive = :isActive', { isActive: false })
        .andWhere('updatedAt < :date', { date: sixMonthsAgo })
        .execute();

      this.logger.log(
        `Cleaned up ${result.affected || 0} inactive users`,
      );
    } catch (error: any) {
      this.logger.error(
        { error: error.message },
        'Error cleaning up inactive users',
      );
    }
  }

  /**
   * Cleanup old logs/files weekly (Sunday at 5 AM)
   */
  @Cron('0 5 * * 0')
  async cleanupOldFiles() {
    this.logger.log('Starting cleanup of old files');

    try {
      // Placeholder for file cleanup logic
      // This would typically clean up old uploaded files, logs, etc.
      this.logger.log('Old files cleanup completed');
    } catch (error: any) {
      this.logger.error({ error: error.message }, 'Error cleaning up old files');
    }
  }
}
