import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueueService } from '../../queue/queue.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class RetryScheduler {
  private readonly logger = new Logger(RetryScheduler.name);

  constructor(
    private queueService: QueueService,
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('notification') private notificationQueue: Queue,
    @InjectQueue('default') private defaultQueue: Queue,
  ) {}

  /**
   * Retry failed email jobs every 30 minutes
   */
  @Cron('*/30 * * * *')
  async retryFailedEmailJobs() {
    this.logger.log('Starting retry of failed email jobs');

    try {
      const failedJobs = await this.emailQueue.getFailed();
      const maxRetries = 3;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      let retried = 0;
      for (const job of failedJobs) {
        const jobAge = Date.now() - job.timestamp;
        const attempts = job.attemptsMade || 0;

        if (attempts < maxRetries && jobAge < maxAge) {
          try {
            await job.retry();
            retried++;
            this.logger.debug(
              { jobId: job.id, attempts: attempts + 1 },
              'Retried failed email job',
            );
          } catch (error: any) {
            this.logger.warn(
              { jobId: job.id, error: error.message },
              'Failed to retry email job',
            );
          }
        }
      }

      if (retried > 0) {
        this.logger.log(`Retried ${retried} failed email jobs`);
      }
    } catch (error: any) {
      this.logger.error(
        { error: error.message },
        'Error retrying failed email jobs',
      );
    }
  }

  /**
   * Retry failed notification jobs every 15 minutes
   */
  @Cron('*/15 * * * *')
  async retryFailedNotificationJobs() {
    this.logger.log('Starting retry of failed notification jobs');

    try {
      const failedJobs = await this.notificationQueue.getFailed();
      const maxRetries = 3;
      const maxAge = 12 * 60 * 60 * 1000; // 12 hours

      let retried = 0;
      for (const job of failedJobs) {
        const jobAge = Date.now() - job.timestamp;
        const attempts = job.attemptsMade || 0;

        if (attempts < maxRetries && jobAge < maxAge) {
          try {
            await job.retry();
            retried++;
            this.logger.debug(
              { jobId: job.id, attempts: attempts + 1 },
              'Retried failed notification job',
            );
          } catch (error: any) {
            this.logger.warn(
              { jobId: job.id, error: error.message },
              'Failed to retry notification job',
            );
          }
        }
      }

      if (retried > 0) {
        this.logger.log(`Retried ${retried} failed notification jobs`);
      }
    } catch (error: any) {
      this.logger.error(
        { error: error.message },
        'Error retrying failed notification jobs',
      );
    }
  }

  /**
   * Retry failed default queue jobs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async retryFailedDefaultJobs() {
    this.logger.log('Starting retry of failed default queue jobs');

    try {
      const failedJobs = await this.defaultQueue.getFailed();
      const maxRetries = 5;
      const maxAge = 48 * 60 * 60 * 1000; // 48 hours

      let retried = 0;
      for (const job of failedJobs) {
        const jobAge = Date.now() - job.timestamp;
        const attempts = job.attemptsMade || 0;

        if (attempts < maxRetries && jobAge < maxAge) {
          try {
            await job.retry();
            retried++;
            this.logger.debug(
              { jobId: job.id, attempts: attempts + 1 },
              'Retried failed default job',
            );
          } catch (error: any) {
            this.logger.warn(
              { jobId: job.id, error: error.message },
              'Failed to retry default job',
            );
          }
        }
      }

      if (retried > 0) {
        this.logger.log(`Retried ${retried} failed default queue jobs`);
      }
    } catch (error: any) {
      this.logger.error(
        { error: error.message },
        'Error retrying failed default queue jobs',
      );
    }
  }
}
