import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter, SendMailOptions } from 'nodemailer';
import { MailTemplateService, TemplateName } from './mail-template.service';

export interface MailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}

@Injectable()
export class MailService {
  private transporter: Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(
    private configService: ConfigService,
    private mailTemplateService: MailTemplateService,
  ) {
    const mail = this.configService.get('mail');

    this.transporter = nodemailer.createTransport({
      host: mail?.host || 'smtp.gmail.com',
      port: mail?.port || 587,
      secure: mail?.secure || false, // true for 465, false for other ports
      auth: {
        user: mail?.auth?.user || '',
        pass: mail?.auth?.pass || '',
      },
    });

    // Verify connection
    this.verifyConnection();
  }

  /**
   * Verify SMTP connection
   */
  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
    } catch (error: any) {
      this.logger.error(
        { error: error.message },
        'SMTP connection verification failed',
      );
    }
  }

  /**
   * Send email
   */
  async sendMail(options: MailOptions): Promise<void> {
    const mail = this.configService.get('mail');
    const from = mail?.from || mail?.auth?.user || '';
    const fromName = mail?.fromName || 'NestJS App';

    const mailOptions: SendMailOptions = {
      from: `"${fromName}" <${from}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully: messageId=${info.messageId}, to=${Array.isArray(
          options.to,
        ) ? options.to.join(',') : options.to}, subject=${options.subject}`,
      );
    } catch (error: any) {
      this.logger.error(
        {
          to: options.to,
          subject: options.subject,
          error: error.message,
        },
        'Failed to send email',
      );
      throw error;
    }
  }

  /**
   * Send email with template
   */
  async sendTemplatedEmail(
    to: string | string[],
    subject: string,
    templateName: TemplateName,
    context: Record<string, any> = {},
  ): Promise<void> {
    const html = this.mailTemplateService.render(templateName, context);
    const text = this.getPlainTextFromHtml(html);

    await this.sendMail({
      to,
      subject,
      html,
      text,
    });
  }

  private getPlainTextFromHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(options: MailOptions[]): Promise<void> {
    this.logger.log(`Sending bulk emails: ${options.length} emails`);

    const results = await Promise.allSettled(
      options.map((option) => this.sendMail(option)),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    this.logger.log(
      `Bulk emails sent: total=${options.length}, succeeded=${succeeded}, failed=${failed}`,
    );

    if (failed > 0) {
      throw new Error(`Failed to send ${failed} out of ${options.length} emails`);
    }
  }

  /**
   * Send welcome email (uses template from templates/welcome.html)
   */
  async sendWelcomeEmail(
    to: string,
    name: string,
    activationLink?: string,
  ): Promise<void> {
    const subject = 'Welcome to our platform!';
    const html = this.mailTemplateService.renderWelcome({ name, activationLink });

    await this.sendMail({
      to,
      subject,
      html,
      text: `Welcome, ${name}! Thank you for registering with us.${activationLink ? ` Click here to activate: ${activationLink}` : ''}`,
    });
  }

  /**
   * Send password reset email (uses template from templates/password-reset.html)
   */
  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    const subject = 'Password Reset Request';
    const html = this.mailTemplateService.renderPasswordReset({ resetLink });

    await this.sendMail({
      to,
      subject,
      html,
      text: `Password Reset Request. Click here to reset: ${resetLink}. This link expires in 1 hour.`,
    });
  }

  /**
   * Send verification email (uses template from templates/verification.html)
   */
  async sendVerificationEmail(to: string, verificationLink: string): Promise<void> {
    const subject = 'Verify your email address';
    const html = this.mailTemplateService.renderVerification({ verificationLink });

    await this.sendMail({
      to,
      subject,
      html,
      text: `Please verify your email: ${verificationLink}. This link expires in 24 hours.`,
    });
  }
}
