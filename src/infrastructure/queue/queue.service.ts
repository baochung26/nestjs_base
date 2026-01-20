import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

export interface JobData {
  [key: string]: any;
}

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('default') private defaultQueue: Queue,
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('notification') private notificationQueue: Queue,
  ) {}

  /**
   * Add job to default queue
   */
  async addJob(data: JobData, options?: any) {
    return this.defaultQueue.add(data, options);
  }

  /**
   * Add email job
   */
  async addEmailJob(
    data: {
      to: string;
      subject: string;
      template?: string;
      data?: any;
    },
    options?: {
      attempts?: number;
      delay?: number;
      priority?: number;
      backoff?: {
        type: 'fixed' | 'exponential';
        delay: number;
      };
      removeOnComplete?: boolean | number;
      removeOnFail?: boolean | number;
    },
  ) {
    const defaultOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential' as const,
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    };

    return this.emailQueue.add('send-email', data, {
      ...defaultOptions,
      ...options,
    });
  }

  /**
   * Add notification job
   */
  async addNotificationJob(
    data: {
      userId: string;
      type: string;
      message: string;
      data?: any;
    },
    options?: {
      attempts?: number;
      delay?: number;
      priority?: number;
      backoff?: {
        type: 'fixed' | 'exponential';
        delay: number;
      };
      removeOnComplete?: boolean | number;
      removeOnFail?: boolean | number;
    },
  ) {
    const defaultOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential' as const,
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    };

    return this.notificationQueue.add('send-notification', data, {
      ...defaultOptions,
      ...options,
    });
  }

  /**
   * Get queue stats
   */
  async getQueueStats(queueName: string = 'default') {
    let queue: Queue;
    switch (queueName) {
      case 'email':
        queue = this.emailQueue;
        break;
      case 'notification':
        queue = this.notificationQueue;
        break;
      default:
        queue = this.defaultQueue;
    }

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
  async getAllQueuesStats() {
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
  async cleanCompletedJobs(queueName: string = 'default', grace: number = 1000) {
    let queue: Queue;
    switch (queueName) {
      case 'email':
        queue = this.emailQueue;
        break;
      case 'notification':
        queue = this.notificationQueue;
        break;
      default:
        queue = this.defaultQueue;
    }

    return queue.clean(grace, 'completed');
  }

  /**
   * Clean failed jobs
   */
  async cleanFailedJobs(queueName: string = 'default', grace: number = 1000) {
    let queue: Queue;
    switch (queueName) {
      case 'email':
        queue = this.emailQueue;
        break;
      case 'notification':
        queue = this.notificationQueue;
        break;
      default:
        queue = this.defaultQueue;
    }

    return queue.clean(grace, 'failed');
  }
}
