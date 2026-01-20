import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('default')
export class DefaultQueueProcessor {
  private readonly logger = new Logger(DefaultQueueProcessor.name);

  @Process()
  async handleDefaultJob(job: Job) {
    this.logger.log(`Processing default job ${job.id}`);
    this.logger.debug(`Job data: ${JSON.stringify(job.data)}`);

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.logger.log(`Default job ${job.id} completed`);
    return { success: true, jobId: job.id };
  }
}

@Processor('email')
export class EmailQueueProcessor {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  @Process('send-email')
  async handleSendEmail(
    job: Job<{ to: string; subject: string; template?: string; data?: any }>,
  ) {
    this.logger.log(`Processing email job ${job.id} to ${job.data.to}`);

    try {
      // Simulate email sending
      await new Promise((resolve) => setTimeout(resolve, 2000));

      this.logger.log(`Email sent successfully to ${job.data.to}`);
      return {
        success: true,
        jobId: job.id,
        to: job.data.to,
        subject: job.data.subject,
      };
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }
}

@Processor('notification')
export class NotificationQueueProcessor {
  private readonly logger = new Logger(NotificationQueueProcessor.name);

  @Process('send-notification')
  async handleSendNotification(
    job: Job<{ userId: string; type: string; message: string; data?: any }>,
  ) {
    this.logger.log(`Processing notification job ${job.id} for user ${job.data.userId}`);

    try {
      // Simulate notification sending
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.logger.log(`Notification sent successfully to user ${job.data.userId}`);
      return {
        success: true,
        jobId: job.id,
        userId: job.data.userId,
        type: job.data.type,
      };
    } catch (error: any) {
      this.logger.error(`Failed to send notification: ${error.message}`);
      throw error;
    }
  }
}
