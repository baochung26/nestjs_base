import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Logger } from 'nestjs-pino';
import { Transporter, SendMailOptions } from 'nodemailer';

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

  constructor(private configService: ConfigService) {
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
      this.logger.info('SMTP connection verified successfully');
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
      this.logger.info(
        {
          messageId: info.messageId,
          to: options.to,
          subject: options.subject,
        },
        'Email sent successfully',
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
    template: string,
    context: Record<string, any> = {},
  ): Promise<void> {
    // This will be implemented with MailTemplateService
    // For now, just a placeholder
    throw new Error('Template email not implemented yet. Use sendMail instead.');
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(options: MailOptions[]): Promise<void> {
    this.logger.info({ count: options.length }, 'Sending bulk emails');

    const results = await Promise.allSettled(
      options.map((option) => this.sendMail(option)),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    this.logger.info(
      { total: options.length, succeeded, failed },
      'Bulk emails sent',
    );

    if (failed > 0) {
      throw new Error(`Failed to send ${failed} out of ${options.length} emails`);
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    to: string,
    name: string,
    activationLink?: string,
  ): Promise<void> {
    const subject = 'Welcome to our platform!';
    const html = `
      <h1>Welcome, ${name}!</h1>
      <p>Thank you for registering with us.</p>
      ${activationLink ? `<p><a href="${activationLink}">Click here to activate your account</a></p>` : ''}
      <p>Best regards,<br>The Team</p>
    `;

    await this.sendMail({
      to,
      subject,
      html,
      text: `Welcome, ${name}! Thank you for registering with us.${activationLink ? ` Click here to activate: ${activationLink}` : ''}`,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    const subject = 'Password Reset Request';
    const html = `
      <h1>Password Reset Request</h1>
      <p>You have requested to reset your password.</p>
      <p><a href="${resetLink}">Click here to reset your password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>The Team</p>
    `;

    await this.sendMail({
      to,
      subject,
      html,
      text: `Password Reset Request. Click here to reset: ${resetLink}. This link expires in 1 hour.`,
    });
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(to: string, verificationLink: string): Promise<void> {
    const subject = 'Verify your email address';
    const html = `
      <h1>Verify Your Email</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationLink}">Verify Email</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>Best regards,<br>The Team</p>
    `;

    await this.sendMail({
      to,
      subject,
      html,
      text: `Please verify your email: ${verificationLink}. This link expires in 24 hours.`,
    });
  }
}
