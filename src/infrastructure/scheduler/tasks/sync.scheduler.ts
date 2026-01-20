import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../modules/users/entities/user.entity';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class SyncScheduler {
  private readonly logger = new Logger(SyncScheduler.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cacheService: CacheService,
  ) {}

  /**
   * Sync user statistics every 5 minutes
   */
  @Cron('*/5 * * * *')
  async syncUserStatistics() {
    this.logger.log('Starting user statistics sync');

    try {
      const [totalUsers, activeUsers, inactiveUsers] = await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({ where: { isActive: true } }),
        this.userRepository.count({ where: { isActive: false } }),
      ]);

      const stats = {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        updatedAt: new Date(),
      };

      // Cache statistics
      await this.cacheService.set('stats:users', stats, 300); // 5 minutes

      this.logger.log('User statistics synced successfully');
    } catch (error: any) {
      this.logger.error(
        { error: error.message },
        'Error syncing user statistics',
      );
    }
  }

  /**
   * Sync cache with database daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncCacheWithDatabase() {
    this.logger.log('Starting cache sync with database');

    try {
      // Example: Warm up cache with frequently accessed data
      const activeUsers = await this.userRepository.find({
        where: { isActive: true },
        take: 100, // Limit to prevent memory issues
        order: { updatedAt: 'DESC' },
      });

      // Cache active users
      for (const user of activeUsers) {
        const cacheKey = this.cacheService.generateKey('user', user.id);
        await this.cacheService.set(cacheKey, user, 3600); // 1 hour
      }

      this.logger.log(`Cache synced with database, ${activeUsers.length} users cached`);
    } catch (error: any) {
      this.logger.error(
        { error: error.message },
        'Error syncing cache with database',
      );
    }
  }

  /**
   * Sync external services every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async syncExternalServices() {
    this.logger.log('Starting external services sync');

    try {
      // Placeholder for external service sync
      // This could sync with:
      // - Payment gateways
      // - Third-party APIs
      // - External databases
      // - Cloud storage services

      this.logger.log('External services sync completed');
    } catch (error: any) {
      this.logger.error(
        { error: error.message },
        'Error syncing external services',
      );
    }
  }

  /**
   * Health check sync every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async healthCheckSync() {
    this.logger.debug('Performing health check sync');

    try {
      const healthStatus = {
        database: 'ok',
        cache: 'ok',
        timestamp: new Date(),
      };

      // Check database connection
      try {
        await this.userRepository.count();
        healthStatus.database = 'ok';
      } catch {
        healthStatus.database = 'error';
      }

      // Check cache connection
      try {
        await this.cacheService.exists('health:check');
        await this.cacheService.set('health:check', { timestamp: new Date() }, 60);
        healthStatus.cache = 'ok';
      } catch {
        healthStatus.cache = 'error';
      }

      // Cache health status
      await this.cacheService.set('health:status', healthStatus, 120); // 2 minutes

      if (healthStatus.database === 'error' || healthStatus.cache === 'error') {
        this.logger.warn({ healthStatus }, 'Health check detected issues');
      }
    } catch (error: any) {
      this.logger.error(
        { error: error.message },
        'Error performing health check sync',
      );
    }
  }

  /**
   * Data backup sync daily at 1 AM
   */
  @Cron('0 1 * * *')
  async dataBackupSync() {
    this.logger.log('Starting data backup sync');

    try {
      // Placeholder for backup logic
      // This could:
      // - Export database to backup file
      // - Upload to cloud storage
      // - Create snapshots
      // - Archive old data

      this.logger.log('Data backup sync completed');
    } catch (error: any) {
      this.logger.error(
        { error: error.message },
        'Error performing data backup sync',
      );
    }
  }
}
