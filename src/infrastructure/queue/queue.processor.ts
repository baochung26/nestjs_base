import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MailService } from '../mail/mail.service';
import { EmailJobData, NotificationJobData } from './queue.types';

@Processor('default')
export class DefaultQueueProcessor {
  private readonly logger = new Logger(DefaultQueueProcessor.name);

  @Process()
  async handleDefaultJob(job: Job) {
    this.logger.debug(
      `Processing default job: id=${job.id}, data=${JSON.stringify(job.data)}`,
    );

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.logger.log(`Default job completed: id=${job.id}`);
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
  async handleSendEmail(job: Job<EmailJobData>) {
    this.logger.log(
      `Processing email job: id=${job.id}, to=${job.data.to}, subject=${job.data.subject}`,
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

      this.logger.log(
        `Email sent successfully: id=${job.id}, to=${job.data.to}`,
      );
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
  async handleSendNotification(job: Job<NotificationJobData>) {
    this.logger.log(
      `Processing notification job: id=${job.id}, userId=${job.data.userId}, type=${job.data.type}`,
    );

    try {
      // Simulate notification sending
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.logger.log(
        `Notification sent successfully: id=${job.id}, userId=${job.data.userId}`,
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
