import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  EmailJobData,
  NotificationJobData,
  DefaultJobData,
  QueueJobOptions,
  QueueStats,
  AllQueuesStats,
  QueueName,
} from './queue.types';
import { DEFAULT_JOB_OPTIONS } from './queue.constants';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('default') private readonly defaultQueue: Queue,
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('notification') private readonly notificationQueue: Queue,
  ) {}

  /**
   * Lấy queue instance theo tên
   */
  private getQueueByName(queueName: QueueName): Queue {
    const queueMap: Record<QueueName, Queue> = {
      default: this.defaultQueue,
      email: this.emailQueue,
      notification: this.notificationQueue,
    };

    const queue = queueMap[queueName];
    if (!queue) {
      throw new Error(`Queue "${queueName}" not found`);
    }

    return queue;
  }

  /**
   * Add job to default queue
   */
  async addJob(data: DefaultJobData, options?: QueueJobOptions) {
    this.logger.debug(`Adding job to default queue: ${JSON.stringify(data)}`);
    return this.defaultQueue.add(data, options);
  }

  /**
   * Add email job
   */
  async addEmailJob(
    data: EmailJobData,
    options?: Partial<QueueJobOptions>,
  ) {
    this.logger.debug(`Adding email job: to=${data.to}, subject=${data.subject}`);

    const jobOptions: QueueJobOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
    };

    return this.emailQueue.add('send-email', data, jobOptions);
  }

  /**
   * Add notification job
   */
  async addNotificationJob(
    data: NotificationJobData,
    options?: Partial<QueueJobOptions>,
  ) {
    this.logger.debug(
      `Adding notification job: userId=${data.userId}, type=${data.type}`,
    );

    const jobOptions: QueueJobOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...options,
    };

    return this.notificationQueue.add('send-notification', data, jobOptions);
  }

  /**
   * Get queue stats
   */
  async getQueueStats(queueName: QueueName = 'default'): Promise<QueueStats> {
    const queue = this.getQueueByName(queueName);

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      queue: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Get all queues stats
   */
  async getAllQueuesStats(): Promise<AllQueuesStats> {
    const [defaultStats, emailStats, notificationStats] = await Promise.all([
      this.getQueueStats('default'),
      this.getQueueStats('email'),
      this.getQueueStats('notification'),
    ]);

    return {
      default: defaultStats,
      email: emailStats,
      notification: notificationStats,
    };
  }

  /**
   * Clean completed jobs
   */
  async cleanCompletedJobs(
    queueName: QueueName = 'default',
    grace: number = 1000,
  ) {
    this.logger.log(`Cleaning completed jobs from queue: ${queueName}`);
    const queue = this.getQueueByName(queueName);
    return queue.clean(grace, 'completed');
  }

  /**
   * Clean failed jobs
   */
  async cleanFailedJobs(queueName: QueueName = 'default', grace: number = 1000) {
    this.logger.log(`Cleaning failed jobs from queue: ${queueName}`);
    const queue = this.getQueueByName(queueName);
    return queue.clean(grace, 'failed');
  }
}
