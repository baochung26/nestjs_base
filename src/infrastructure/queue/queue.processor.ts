import { Processor, Process, Inject } from '@nestjs/bull';
import { Logger } from 'nestjs-pino';
import { Job } from 'bull';
import { MailService } from '../mail/mail.service';

@Processor('default')
export class DefaultQueueProcessor {
  private readonly logger = new Logger(DefaultQueueProcessor.name);

  @Process()
  async handleDefaultJob(job: Job) {
    this.logger.debug({ jobId: job.id, data: job.data }, 'Processing default job');

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.logger.info({ jobId: job.id }, 'Default job completed');
    return { success: true, jobId: job.id };
  }
}

@Processor('email')
export class EmailQueueProcessor {
  private readonly logger = new Logger(EmailQueueProcessor.name);

  constructor(
    private readonly mailService?: MailService,
  ) {}

  @Process('send-email')
  async handleSendEmail(
    job: Job<{ to: string; subject: string; text?: string; html?: string; template?: string; data?: any }>,
  ) {
    this.logger.info(
      { jobId: job.id, to: job.data.to, subject: job.data.subject },
      'Processing email job',
    );

    try {
      if (this.mailService) {
        // Use real mail service if available
        await this.mailService.sendMail({
          to: job.data.to,
          subject: job.data.subject,
          text: job.data.text,
          html: job.data.html,
        });
      } else {
        // Simulate email sending if mail service not available
        this.logger.warn('MailService not injected, simulating email send');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      this.logger.info({ jobId: job.id, to: job.data.to }, 'Email sent successfully');
      return {
        success: true,
        jobId: job.id,
        to: job.data.to,
        subject: job.data.subject,
      };
    } catch (error: any) {
      this.logger.error(
        { jobId: job.id, to: job.data.to, error: error.message },
        'Failed to send email',
      );
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
    this.logger.info(
      { jobId: job.id, userId: job.data.userId, type: job.data.type },
      'Processing notification job',
    );

    try {
      // Simulate notification sending
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.logger.info(
        { jobId: job.id, userId: job.data.userId },
        'Notification sent successfully',
      );
      return {
        success: true,
        jobId: job.id,
        userId: job.data.userId,
        type: job.data.type,
      };
    } catch (error: any) {
      this.logger.error(
        { jobId: job.id, userId: job.data.userId, error: error.message },
        'Failed to send notification',
      );
      throw error;
    }
  }
}
