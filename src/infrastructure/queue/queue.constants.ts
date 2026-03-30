import { QueueJobOptions } from './queue.types';

/**
 * Default job options cho tất cả queues
 */
export const DEFAULT_JOB_OPTIONS: QueueJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: true,
  removeOnFail: false,
} as const;
