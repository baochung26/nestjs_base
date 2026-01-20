import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

export interface TemplateContext {
  [key: string]: any;
}

@Injectable()
export class MailTemplateService {
  private readonly logger = new Logger(MailTemplateService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Render template with context
   */
  renderTemplate(template: string, context: TemplateContext): string {
    try {
      let html = template;

      // Replace placeholders {{key}} with context values
      Object.keys(context).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, context[key] || '');
      });

      return html;
    } catch (error: any) {
      this.logger.error(
        { error: error.message },
        'Error rendering template',
      );
      throw error;
    }
  }

  /**
   * Get welcome email template
   */
  getWelcomeTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Our Platform!</h1>
            </div>
            <div class="content">
              <p>Hello {{name}},</p>
              <p>Thank you for registering with us. We're excited to have you on board!</p>
              {{#if activationLink}}
              <p style="text-align: center;">
                <a href="{{activationLink}}" class="button">Activate Account</a>
              </p>
              {{/if}}
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Best regards,<br>The Team</p>
            </div>
            <div class="footer">
              <p>© 2024 NestJS App. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get password reset email template
   */
  getPasswordResetTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 10px 20px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You have requested to reset your password. Click the button below to proceed:</p>
              <p style="text-align: center;">
                <a href="{{resetLink}}" class="button">Reset Password</a>
              </p>
              <div class="warning">
                <strong>Important:</strong> This link will expire in 1 hour. If you didn't request this, please ignore this email.
              </div>
              <p>Best regards,<br>The Team</p>
            </div>
            <div class="footer">
              <p>© 2024 NestJS App. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get verification email template
   */
  getVerificationTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Please verify your email address by clicking the button below:</p>
              <p style="text-align: center;">
                <a href="{{verificationLink}}" class="button">Verify Email</a>
              </p>
              <p>This link will expire in 24 hours.</p>
              <p>Best regards,<br>The Team</p>
            </div>
            <div class="footer">
              <p>© 2024 NestJS App. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get notification email template
   */
  getNotificationTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #9C27B0; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>{{title}}</h1>
            </div>
            <div class="content">
              <p>{{message}}</p>
              {{#if link}}
              <p><a href="{{link}}">View Details</a></p>
              {{/if}}
              <p>Best regards,<br>The Team</p>
            </div>
            <div class="footer">
              <p>© 2024 NestJS App. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
