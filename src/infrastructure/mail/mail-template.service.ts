import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface TemplateContext {
  [key: string]: any;
}

export type TemplateName = 'welcome' | 'password-reset' | 'verification' | 'notification';

@Injectable()
export class MailTemplateService {
  private readonly logger = new Logger(MailTemplateService.name);
  private readonly templatesDir = path.join(__dirname, 'templates');
  private readonly cache = new Map<string, string>();

  /**
   * Load template from file (with cache)
   */
  loadTemplate(name: TemplateName): string {
    const cached = this.cache.get(name);
    if (cached) return cached;

    const filePath = path.join(this.templatesDir, `${name}.html`);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      this.cache.set(name, content);
      return content;
    } catch (error: any) {
      this.logger.error({ error: error.message, name }, 'Failed to load template');
      throw error;
    }
  }

  /**
   * Render template with context - replaces {{key}} with context values
   */
  renderTemplate(template: string, context: TemplateContext): string {
    try {
      let html = template;
      const year = new Date().getFullYear();

      const fullContext = { ...context, year };

      Object.keys(fullContext).forEach((key) => {
        const value = fullContext[key];
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, value != null ? String(value) : '');
      });

      // Remove any remaining unreplaced placeholders
      html = html.replace(/\{\{[^}]+\}\}/g, '');

      return html;
    } catch (error: any) {
      this.logger.error({ error: error.message }, 'Error rendering template');
      throw error;
    }
  }

  /**
   * Render named template with context
   */
  render(name: TemplateName, context: TemplateContext): string {
    const template = this.loadTemplate(name);
    return this.renderTemplate(template, context);
  }

  /**
   * Welcome email: name, activationLink (optional)
   */
  renderWelcome(context: { name: string; activationLink?: string }): string {
    const activationButton = context.activationLink
      ? `<p style="text-align: center;"><a href="${context.activationLink}" class="button">Activate Account</a></p>`
      : '';
    return this.render('welcome', {
      ...context,
      activationButton,
    });
  }

  /**
   * Password reset email: resetLink
   */
  renderPasswordReset(context: { resetLink: string }): string {
    return this.render('password-reset', context);
  }

  /**
   * Verification email: verificationLink
   */
  renderVerification(context: { verificationLink: string }): string {
    return this.render('verification', context);
  }

  /**
   * Notification email: title, message, link (optional)
   */
  renderNotification(context: { title: string; message: string; link?: string }): string {
    const linkBlock = context.link
      ? `<p><a href="${context.link}">View Details</a></p>`
      : '';
    return this.render('notification', {
      ...context,
      linkBlock,
    });
  }

  /**
   * Clear template cache (useful for development / hot reload)
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log('Template cache cleared');
  }
}
