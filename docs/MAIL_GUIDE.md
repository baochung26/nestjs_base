# Hướng dẫn Sử dụng Mail Module

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Cấu hình](#cấu-hình)
- [Mail Service](#mail-service)
- [Mail Templates](#mail-templates)
- [Tích hợp với Queue](#tích-hợp-với-queue)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Tổng quan

Mail Module sử dụng **Nodemailer** để gửi email với các tính năng:

- ✅ SMTP email sending
- ✅ HTML và text email support
- ✅ Email templates
- ✅ Attachments support
- ✅ Bulk email sending
- ✅ Tích hợp với Queue system
- ✅ Pre-built email templates (Welcome, Password Reset, Verification)

## ⚙️ Cấu hình

### Environment Variables

Thêm vào file `.env`:

```env
# Mail Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false                    # true for 465, false for other ports
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password      # App password for Gmail
MAIL_FROM=your-email@gmail.com       # Default from address
MAIL_FROM_NAME=NestJS App            # Default from name
```

### Gmail Setup

1. **Enable 2-Step Verification** trong Google Account
2. **Generate App Password:**
   - Go to Google Account → Security
   - 2-Step Verification → App passwords
   - Generate password cho "Mail"
3. **Sử dụng App Password** trong `MAIL_PASSWORD`

### Other SMTP Providers

#### SendGrid

```env
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASSWORD=your-sendgrid-api-key
```

#### Mailgun

```env
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USER=your-mailgun-username
MAIL_PASSWORD=your-mailgun-password
```

#### AWS SES

```env
MAIL_HOST=email-smtp.us-east-1.amazonaws.com
MAIL_PORT=587
MAIL_USER=your-aws-access-key
MAIL_PASSWORD=your-aws-secret-key
```

## 📧 Mail Service

### Inject MailService

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from '../infrastructure/mail/mail.service';

@Injectable()
export class YourService {
  constructor(private mailService: MailService) {}
}
```

### Basic Email Sending

#### Send Simple Email

```typescript
await this.mailService.sendMail({
  to: 'user@example.com',
  subject: 'Hello',
  text: 'This is a plain text email',
  html: '<h1>This is an HTML email</h1>',
});
```

#### Send Email with CC/BCC

```typescript
await this.mailService.sendMail({
  to: 'user@example.com',
  cc: 'manager@example.com',
  bcc: 'admin@example.com',
  subject: 'Important Update',
  html: '<p>Your message here</p>',
});
```

#### Send Email to Multiple Recipients

```typescript
await this.mailService.sendMail({
  to: ['user1@example.com', 'user2@example.com'],
  subject: 'Bulk Email',
  html: '<p>Message to all</p>',
});
```

#### Send Email with Attachments

```typescript
await this.mailService.sendMail({
  to: 'user@example.com',
  subject: 'Document Attached',
  html: '<p>Please find attached document</p>',
  attachments: [
    {
      filename: 'document.pdf',
      path: '/path/to/document.pdf',
    },
    {
      filename: 'image.png',
      content: buffer, // Buffer của image
      contentType: 'image/png',
    },
  ],
});
```

### Pre-built Email Methods

#### Send Welcome Email

```typescript
await this.mailService.sendWelcomeEmail(
  'user@example.com',
  'John Doe',
  'https://example.com/activate?token=abc123', // Optional activation link
);
```

#### Send Password Reset Email

```typescript
await this.mailService.sendPasswordResetEmail(
  'user@example.com',
  'https://example.com/reset-password?token=xyz789',
);
```

#### Send Verification Email

```typescript
await this.mailService.sendVerificationEmail(
  'user@example.com',
  'https://example.com/verify-email?token=def456',
);
```

### Bulk Email Sending

```typescript
const emails = [
  {
    to: 'user1@example.com',
    subject: 'Newsletter',
    html: '<p>Content 1</p>',
  },
  {
    to: 'user2@example.com',
    subject: 'Newsletter',
    html: '<p>Content 2</p>',
  },
];

await this.mailService.sendBulkEmails(emails);
```

## 🎨 Mail Templates

### Cấu trúc thư mục

```
src/infrastructure/mail/
├── mail.module.ts
├── mail.service.ts
├── mail-template.service.ts   # Logic load + render template
└── templates/                 # HTML templates riêng biệt
    ├── welcome.html
    ├── password-reset.html
    ├── verification.html
    └── notification.html
```

Templates được lưu dưới dạng file `.html` trong thư mục `templates/`, dùng placeholder `{{key}}` để thay thế bằng context.

### MailService (dùng sẵn template)

`sendWelcomeEmail`, `sendPasswordResetEmail`, `sendVerificationEmail` đã tự động dùng templates:

```typescript
// Welcome - dùng templates/welcome.html
await this.mailService.sendWelcomeEmail(
  'user@example.com',
  'John Doe',
  'https://...',
);

// Password reset - dùng templates/password-reset.html
await this.mailService.sendPasswordResetEmail(
  'user@example.com',
  'https://...',
);

// Verification - dùng templates/verification.html
await this.mailService.sendVerificationEmail('user@example.com', 'https://...');
```

### MailTemplateService - render trực tiếp

```typescript
import { MailTemplateService } from '../infrastructure/mail/mail-template.service';

@Injectable()
export class YourService {
  constructor(
    private mailService: MailService,
    private mailTemplateService: MailTemplateService,
  ) {}

  async sendTemplatedEmail() {
    // Cách 1: Dùng helper có sẵn
    const html = this.mailTemplateService.renderWelcome({
      name: 'John Doe',
      activationLink: 'https://example.com/activate?token=123',
    });

    await this.mailService.sendMail({
      to: 'user@example.com',
      subject: 'Welcome!',
      html,
    });
  }
}
```

### sendTemplatedEmail (template tổng quát)

```typescript
import { TemplateName } from '../infrastructure/mail/mail-template.service';

await this.mailService.sendTemplatedEmail(
  'user@example.com',
  'Subject',
  'notification',
  { title: 'Alert', message: 'Your message here', link: 'https://...' },
);
```

### Các template và context

| Template       | Method                  | Context                     |
| -------------- | ----------------------- | --------------------------- |
| welcome        | `renderWelcome()`       | `name`, `activationLink?`   |
| password-reset | `renderPasswordReset()` | `resetLink`                 |
| verification   | `renderVerification()`  | `verificationLink`          |
| notification   | `renderNotification()`  | `title`, `message`, `link?` |

### Thêm template mới

1. Tạo file `templates/my-template.html` với placeholders `{{key}}`
2. Thêm tên vào `TemplateName` trong `mail-template.service.ts`
3. Thêm method helper (nếu cần) hoặc dùng `render('my-template', context)`

## 🔄 Tích hợp với Queue

### Send Email via Queue

```typescript
import { QueueService } from '../infrastructure/queue/queue.service';

@Injectable()
export class YourService {
  constructor(private queueService: QueueService) {}

  async sendWelcomeEmailAsync(userEmail: string) {
    // Add email job to queue
    await this.queueService.addEmailJob({
      to: userEmail,
      subject: 'Welcome!',
      html: '<h1>Welcome to our platform!</h1>',
    });
  }
}
```

### Email Queue Processor

Email processor tự động xử lý email jobs từ queue:

```typescript
// Processor sẽ tự động:
// 1. Lấy job từ email queue
// 2. Gọi MailService.sendMail()
// 3. Log kết quả
```

## 💡 Best Practices

### 1. Use Queue for Non-Critical Emails

```typescript
// ✅ Good - Non-blocking
await this.queueService.addEmailJob({
  to: user.email,
  subject: 'Welcome',
  html: welcomeHtml,
});

// ❌ Bad - Blocking
await this.mailService.sendMail({
  to: user.email,
  subject: 'Welcome',
  html: welcomeHtml,
});
```

### 2. Error Handling

```typescript
try {
  await this.mailService.sendMail({
    to: user.email,
    subject: 'Important',
    html: content,
  });
} catch (error) {
  this.logger.error(
    { error: error.message, to: user.email },
    'Failed to send email',
  );
  // Handle error appropriately
}
```

### 3. Email Templates

```typescript
// ✅ Good - Use templates
const html = this.mailTemplateService.renderTemplate(
  this.mailTemplateService.getWelcomeTemplate(),
  { name: user.firstName },
);

// ❌ Bad - Hardcoded HTML
const html = '<h1>Welcome</h1>';
```

### 4. Validate Email Addresses

```typescript
import { IsEmail } from 'class-validator';

class SendEmailDto {
  @IsEmail()
  to: string;
}
```

### 5. Rate Limiting

Sử dụng queue để limit số lượng emails gửi:

```typescript
// Queue tự động rate limit
await this.queueService.addEmailJob(data, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
});
```

## 🐛 Troubleshooting

### SMTP Connection Failed

**Nguyên nhân:** Sai credentials hoặc SMTP settings.

**Giải pháp:**

1. Kiểm tra `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`
2. Với Gmail, đảm bảo đã enable 2-Step Verification và dùng App Password
3. Kiểm tra firewall/network restrictions

### Emails Not Received

**Nguyên nhân:** Email bị spam filter hoặc sai address.

**Giải pháp:**

1. Kiểm tra spam folder
2. Verify email address
3. Sử dụng reputable SMTP provider
4. Setup SPF, DKIM records cho domain

### Timeout Errors

**Nguyên nhân:** SMTP server chậm hoặc network issues.

**Giải pháp:**

1. Increase timeout settings
2. Use queue để retry tự động
3. Check network connectivity

### Attachment Issues

**Nguyên nhân:** File quá lớn hoặc path sai.

**Giải pháp:**

1. Kiểm tra file size limits
2. Verify file paths
3. Use Buffer thay vì path nếu cần

## 📖 Ví dụ Sử dụng

### Complete Service với Mail

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from '../infrastructure/mail/mail.service';
import { MailTemplateService } from '../infrastructure/mail/mail-template.service';
import { QueueService } from '../infrastructure/queue/queue.service';

@Injectable()
export class NotificationService {
  constructor(
    private mailService: MailService,
    private mailTemplateService: MailTemplateService,
    private queueService: QueueService,
  ) {}

  async sendWelcomeEmail(userEmail: string, userName: string) {
    // Send via queue (async, non-blocking)
    await this.queueService.addEmailJob({
      to: userEmail,
      subject: 'Welcome!',
      html: this.mailTemplateService.renderTemplate(
        this.mailTemplateService.getWelcomeTemplate(),
        { name: userName },
      ),
    });
  }

  async sendPasswordResetEmail(userEmail: string, resetToken: string) {
    const resetLink = `https://example.com/reset-password?token=${resetToken}`;

    // Send directly (synchronous)
    await this.mailService.sendPasswordResetEmail(userEmail, resetLink);
  }

  async sendBulkNewsletter(recipients: string[], content: string) {
    const emails = recipients.map((email) => ({
      to: email,
      subject: 'Newsletter',
      html: content,
    }));

    await this.mailService.sendBulkEmails(emails);
  }
}
```

### Controller với Mail

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { MailService } from '../infrastructure/mail/mail.service';

@Controller('mail')
export class MailController {
  constructor(private mailService: MailService) {}

  @Post('send')
  async sendEmail(
    @Body() data: { to: string; subject: string; message: string },
  ) {
    await this.mailService.sendMail({
      to: data.to,
      subject: data.subject,
      html: `<p>${data.message}</p>`,
    });

    return { message: 'Email sent successfully' };
  }
}
```

## 🔗 Tài liệu liên quan

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [NestJS Mail Module](https://docs.nestjs.com/techniques/mail)
- [Gmail SMTP Setup](https://support.google.com/mail/answer/7126229)
