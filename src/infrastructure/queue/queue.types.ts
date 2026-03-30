import { JobOptions } from 'bull';

/**
 * Job data types cho các queues
 */
export interface EmailJobData {
  to: string;
  subject: string;
  template?: string;
  data?: Record<string, any>;
  text?: string;
  html?: string;
}

export interface NotificationJobData {
  userId: string;
  type: string;
  message: string;
  data?: Record<string, any>;
}

export interface DefaultJobData {
  [key: string]: any;
}

/**
 * Job options với type safety
 */
export interface QueueJobOptions extends Omit<JobOptions, 'backoff'> {
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}

/**
 * Queue stats response
 */
export interface QueueStats {
  queue: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

/**
 * All queues stats response
 */
export interface AllQueuesStats {
  default: QueueStats;
  email: QueueStats;
  notification: QueueStats;
}

/**
 * Queue names type
 */
export type QueueName = 'default' | 'email' | 'notification';
