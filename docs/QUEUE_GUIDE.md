# Hướng dẫn Sử dụng Queue System

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc Queue](#kiến-trúc-queue)
- [Cấu hình](#cấu-hình)
- [Sử dụng QueueService](#sử-dụng-queueservice)
- [Flow xử lý Job](#flow-xử-lý-job)
- [Types và Constants](#types-và-constants)
- [Tạo Processors Mới](#tạo-processors-mới)
- [API Endpoints](#api-endpoints)
- [Monitoring và Debugging](#monitoring-và-debugging)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Tổng quan

Queue system sử dụng **Bull** và **Redis** để xử lý background jobs một cách bất đồng bộ. Hệ thống cho phép:

- ✅ Xử lý các tác vụ nặng mà không block main thread
- ✅ Retry tự động khi job fail
- ✅ Delay jobs để thực thi sau
- ✅ Priority queues
- ✅ Monitoring và statistics với **Bull Board UI** (giống Laravel Horizon)
- ✅ Job scheduling
- ✅ Xem và retry failed jobs qua UI

### Queues có sẵn

| Queue Name     | Mô tả                            | Processor                    |
| -------------- | -------------------------------- | ---------------------------- |
| `default`      | Queue mặc định cho các job chung | `DefaultQueueProcessor`      |
| `email`        | Queue cho email jobs             | `EmailQueueProcessor`        |
| `notification` | Queue cho notification jobs      | `NotificationQueueProcessor` |

## 🏗️ Kiến trúc Queue

```
┌─────────────┐
│   Service   │  ──addJob()──>  ┌──────────┐
│             │                  │  Queue   │
│ (Your Code) │                  │  (Redis) │
└─────────────┘                  └──────────┘
                                         │
                                         │ process
                                         ▼
                                 ┌──────────────┐
                                 │  Processor   │
                                 │  (Worker)    │
                                 └──────────────┘
```

### Flow hoạt động

1. **Service** thêm job vào queue thông qua `QueueService`
2. **Queue** lưu job vào Redis
3. **Processor** (worker) lấy job từ queue và xử lý
4. Kết quả được lưu lại (completed/failed)

### Cấu trúc Code

```
src/infrastructure/queue/
├── queue.types.ts          # Types: EmailJobData, NotificationJobData, QueueJobOptions, QueueStats
├── queue.constants.ts      # Constants: DEFAULT_JOB_OPTIONS
├── queue.service.ts         # QueueService - main service
├── queue.processor.ts       # Processors - xử lý jobs
├── queue.controller.ts      # API endpoints (admin only)
└── ...
```

**Types được định nghĩa tập trung** trong `queue.types.ts` để đảm bảo type safety và consistency.

## ⚙️ Cấu hình

### Redis Configuration

File `.env`:

```env
# Redis Configuration
REDIS_HOST=redis          # hoặc localhost nếu không dùng Docker
REDIS_PORT=6379
REDIS_PASSWORD=           # Optional
REDIS_DB=0               # Database number (0-15)
```

### Queue Configuration

Cấu hình mặc định trong `queue.module.ts`:

```typescript
defaultJobOptions: {
  attempts: 3,              // Retry 3 lần nếu fail
  backoff: {
    type: 'exponential',     // Exponential backoff
    delay: 2000,            // Delay 2 giây
  },
  removeOnComplete: true,   // Xóa job sau khi complete
  removeOnFail: false,      // Giữ lại job failed để debug
}
```

## 📚 Sử dụng QueueService

### Import QueueService

```typescript
import { Injectable } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class YourService {
  constructor(private queueService: QueueService) {}
}
```

### 1. Thêm Email Job

```typescript
async sendWelcomeEmail(userEmail: string, userName: string) {
  await this.queueService.addEmailJob({
    to: userEmail,
    subject: 'Welcome to our platform!',
    template: 'welcome',
    data: {
      name: userName,
      activationLink: 'https://example.com/activate',
    },
  });
}
```

**Options mặc định** (từ `DEFAULT_JOB_OPTIONS` trong `queue.constants.ts`):

- `attempts: 3` - Retry 3 lần nếu fail
- `backoff: exponential` - Exponential backoff với delay 2s
- `removeOnComplete: true` - Xóa job sau khi complete
- `removeOnFail: false` - Giữ lại job failed để debug

Bạn có thể override options khi gọi:

```typescript
await this.queueService.addEmailJob(data, {
  attempts: 5,
  delay: 10000, // Delay 10 giây
});
```

### 2. Thêm Notification Job

```typescript
async notifyUser(userId: string, message: string) {
  await this.queueService.addNotificationJob({
    userId: userId,
    type: 'info',
    message: message,
    data: {
      priority: 'high',
      category: 'system',
    },
  });
}
```

### 3. Thêm Custom Job vào Default Queue

```typescript
import { DefaultJobData, QueueJobOptions } from '../queue/queue.types';

async processData(data: DefaultJobData) {
  await this.queueService.addJob(
    {
      type: 'data-processing',
      payload: data,
    },
    {
      attempts: 5,
      delay: 5000,        // Delay 5 giây trước khi xử lý
      priority: 1,        // Priority (higher = processed first)
    } as QueueJobOptions,
  );
}
```

### 4. Job với Delay

```typescript
// Gửi email sau 1 giờ
await this.queueService.addEmailJob(
  {
    to: 'user@example.com',
    subject: 'Reminder',
    template: 'reminder',
  },
  {
    delay: 3600000, // 1 giờ = 3600000ms
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
);
```

### 5. Job với Priority

```typescript
// High priority job
await this.queueService.addJob(
  { type: 'urgent', data: 'important' },
  { priority: 10 },
);

// Low priority job
await this.queueService.addJob(
  { type: 'normal', data: 'normal' },
  { priority: 1 },
);
```

### 6. Job với Schedule (Cron-like)

```typescript
import * as cron from 'node-cron';

// Thêm job được schedule
await this.queueService.addJob(
  { type: 'scheduled-task' },
  {
    repeat: {
      cron: '0 0 * * *', // Chạy mỗi ngày lúc 00:00
    },
  },
);
```

## 🔄 Flow xử lý Job

### Ví dụ: Flow xử lý Email Job

Khi bạn gọi `addEmailJob()`, đây là flow hoàn chỉnh từ lúc đẩy job đến khi mail được gửi:

#### 1. Đẩy Job vào Queue (`queue.service.ts`)

```typescript
// Service/Controller của bạn
await this.queueService.addEmailJob({
  to: 'user@example.com',
  subject: 'Welcome!',
  template: 'welcome',
  data: { name: 'John' },
});
```

**Chuyện gì xảy ra:**

- `addEmailJob()` đẩy job vào Redis queue (`email`)
- Function trả về ngay lập tức (không chờ gửi mail)
- Mail chưa được gửi ở bước này

```typescript
// queue.service.ts
async addEmailJob(data: EmailJobData, options?: Partial<QueueJobOptions>) {
  // Chỉ đẩy job vào Redis queue
  return this.emailQueue.add('send-email', data, jobOptions);
  // ↑ Job được lưu trong Redis, chưa được xử lý
}
```

#### 2. Processor tự động xử lý (`queue.processor.ts`)

**EmailQueueProcessor** (worker) tự động:

- Lấy job từ queue `email`
- Gọi `handleSendEmail()` để xử lý
- Gửi mail thực tế qua `MailService`

```typescript
// queue.processor.ts
@Processor('email') // ← Đăng ký processor cho queue 'email'
export class EmailQueueProcessor {
  constructor(
    private readonly mailService?: MailService, // ← Inject MailService
  ) {}

  @Process('send-email') // ← Xử lý job có name 'send-email'
  async handleSendEmail(job: Job<EmailJobData>) {
    // Processor tự động lấy job từ queue và xử lý

    if (this.mailService) {
      // ← GỬI MAIL THỰC TẾ Ở ĐÂY
      await this.mailService.sendMail({
        to: job.data.to,
        subject: job.data.subject,
        html: job.data.html,
      });
    }
  }
}
```

#### 3. MailService gửi mail (`mail.service.ts`)

```typescript
// mail.service.ts
async sendMail(options: MailOptions): Promise<void> {
  // Gửi mail thực tế qua SMTP (nodemailer)
  await this.transporter.sendMail(mailOptions);
  // ↑ Kết nối SMTP server và gửi email
}
```

### Sơ đồ Flow hoàn chỉnh

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Service/Controller                                       │
│    queueService.addEmailJob({ to, subject, ... })          │
└────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. QueueService (queue.service.ts)                         │
│    emailQueue.add('send-email', data, options)             │
│    → Đẩy job vào Redis queue                               │
│    → Return ngay (không chờ)                               │
└────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Redis Queue                                              │
│    Queue 'email' lưu job:                                   │
│    { id: 123, name: 'send-email', data: {...} }            │
└────────────────────┬──────────────────────────────────────┘
                      │
                      │ Processor tự động lấy job
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. EmailQueueProcessor (queue.processor.ts)                │
│    @Process('send-email')                                   │
│    handleSendEmail(job)                                     │
│    → Lấy job từ queue                                       │
│    → Xử lý bất đồng bộ (không block main thread)          │
└────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. MailService (mail.service.ts)                            │
│    mailService.sendMail({ to, subject, html })              │
│    → Gửi mail qua SMTP server                              │
└────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. SMTP Server                                              │
│    Email được gửi đến user@example.com                     │
└─────────────────────────────────────────────────────────────┘
```

### Tóm tắt

| Bước         | File                 | Hành động                                  | Kết quả                      |
| ------------ | -------------------- | ------------------------------------------ | ---------------------------- |
| 1. Đẩy job   | `queue.service.ts`   | `addEmailJob()` → đẩy vào Redis            | Job được lưu trong queue     |
| 2. Xử lý job | `queue.processor.ts` | `EmailQueueProcessor` tự động lấy và xử lý | Job được process bất đồng bộ |
| 3. Gửi mail  | `mail.service.ts`    | `MailService.sendMail()` → SMTP            | Email được gửi thực tế       |

### Lưu ý quan trọng

- **`addEmailJob()` không gửi mail ngay** - chỉ đẩy job vào queue
- **Processor tự động chạy** - không cần gọi thủ công, NestJS tự động khởi động worker khi app start
- **Xử lý bất đồng bộ** - không block main thread, có thể xử lý nhiều jobs đồng thời
- **Retry tự động** - nếu gửi mail fail, Bull tự động retry theo config (mặc định 3 lần)

### Ví dụ trong thực tế

```typescript
// users.service.ts - Khi user đăng ký
async create(createUserDto: CreateUserDto) {
  const user = await this.usersRepository.save(userData);

  // Đẩy job gửi welcome email vào queue
  await this.queueService.addEmailJob({
    to: user.email,
    subject: 'Welcome!',
    template: 'welcome',
    data: { name: user.firstName },
  });

  // Function return ngay, không chờ email được gửi
  return user;
  // Email sẽ được gửi sau đó bởi EmailQueueProcessor
}
```

## 📦 Types và Constants

### Types (`queue.types.ts`)

Tất cả types được định nghĩa tập trung trong `queue.types.ts`:

```typescript
// Job data types
export interface EmailJobData { ... }
export interface NotificationJobData { ... }
export interface DefaultJobData { ... }

// Job options
export interface QueueJobOptions { ... }

// Stats types
export interface QueueStats { ... }
export interface AllQueuesStats { ... }

// Queue name type
export type QueueName = 'default' | 'email' | 'notification';
```

**Lợi ích:**

- ✅ Type safety - đảm bảo consistency giữa service, processor, controller
- ✅ Dễ maintain - thay đổi một chỗ, áp dụng toàn bộ
- ✅ IntelliSense - IDE tự động suggest fields

### Constants (`queue.constants.ts`)

```typescript
export const DEFAULT_JOB_OPTIONS: QueueJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: true,
  removeOnFail: false,
};
```

**Sử dụng:**

```typescript
import { DEFAULT_JOB_OPTIONS } from './queue.constants';

const jobOptions = {
  ...DEFAULT_JOB_OPTIONS,
  ...customOptions, // Override nếu cần
};
```

## 🔧 Tạo Processors Mới

### Bước 1: Định nghĩa Types

Thêm types vào `queue.types.ts`:

```typescript
export interface YourJobData {
  field1: string;
  field2: number;
  data?: Record<string, any>;
}
```

### Bước 2: Tạo Processor

Tạo file mới hoặc thêm vào `queue.processor.ts`:

```typescript
import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { YourJobData } from './queue.types';

@Processor('your-queue-name')
export class YourQueueProcessor {
  private readonly logger = new Logger(YourQueueProcessor.name);

  @Process('your-job-name')
  async handleYourJob(job: Job<YourJobData>) {
    this.logger.log(`Processing job ${job.id}`);

    try {
      // Xử lý job của bạn
      const result = await this.processData(job.data);

      this.logger.log(`Job ${job.id} completed successfully`);
      return {
        success: true,
        jobId: job.id,
        result: result,
      };
    } catch (error: any) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`);
      throw error; // Throw error để Bull retry
    }
  }

  private async processData(data: YourJobData) {
    // Logic xử lý của bạn
    return { processed: true };
  }
}
```

> **Note:** Import types từ `queue.types.ts` thay vì định nghĩa inline trong processor.

### Bước 3: Đăng ký Queue trong Module

Thêm queue mới vào `queue.module.ts`:

```typescript
BullModule.registerQueue({
  name: 'your-queue-name',
}),
```

### Bước 4: Thêm Processor vào Providers

```typescript
providers: [
  QueueService,
  DefaultQueueProcessor,
  EmailQueueProcessor,
  NotificationQueueProcessor,
  YourQueueProcessor, // Thêm processor mới
],
```

### Bước 4: Thêm Types và Method vào QueueService

**4.1. Thêm types vào `queue.types.ts`:**

```typescript
export interface YourJobData {
  field1: string;
  field2: number;
  data?: Record<string, any>;
}
```

**4.2. Thêm method vào `queue.service.ts`:**

```typescript
import { YourJobData } from './queue.types';
import { DEFAULT_JOB_OPTIONS } from './queue.constants';

@InjectQueue('your-queue-name')
private yourQueue: Queue,

async addYourJob(data: YourJobData, options?: Partial<QueueJobOptions>) {
  this.logger.debug(`Adding your job: ${JSON.stringify(data)}`);

  const jobOptions: QueueJobOptions = {
    ...DEFAULT_JOB_OPTIONS,
    ...options,
  };

  return this.yourQueue.add('your-job-name', data, jobOptions);
}
```

> **Note:** Sử dụng `DEFAULT_JOB_OPTIONS` từ `queue.constants.ts` và `QueueJobOptions` từ `queue.types.ts` để đảm bảo consistency.

### Ví dụ: PDF Generation Queue

**1. Thêm types vào `queue.types.ts`:**

```typescript
export interface PdfJobData {
  userId: string;
  documentId: string;
  options?: Record<string, any>;
}
```

**2. Tạo processor:**

```typescript
// queue.processor.ts
import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PdfJobData } from './queue.types';

@Processor('pdf')
export class PdfQueueProcessor {
  private readonly logger = new Logger(PdfQueueProcessor.name);

  @Process('generate-pdf')
  async handleGeneratePdf(job: Job<PdfJobData>) {
    this.logger.info(
      { jobId: job.id, userId: job.data.userId },
      'Generating PDF',
    );

    try {
      // Generate PDF logic
      const pdfPath = await this.generatePdf(job.data);

      this.logger.info(
        { jobId: job.id, pdfPath },
        'PDF generated successfully',
      );
      return {
        success: true,
        jobId: job.id,
        pdfPath: pdfPath,
      };
    } catch (error: any) {
      this.logger.error(
        { jobId: job.id, error: error.message },
        'PDF generation failed',
      );
      throw error;
    }
  }

  private async generatePdf(data: PdfJobData) {
    // PDF generation logic
    return '/path/to/generated.pdf';
  }
}
```

**3. Thêm method vào `queue.service.ts`:**

```typescript
import { PdfJobData } from './queue.types';
import { DEFAULT_JOB_OPTIONS } from './queue.constants';

async addPdfJob(data: PdfJobData, options?: Partial<QueueJobOptions>) {
  this.logger.debug(`Adding PDF job: userId=${data.userId}, documentId=${data.documentId}`);

  const jobOptions: QueueJobOptions = {
    ...DEFAULT_JOB_OPTIONS,
    ...options,
  };

  return this.pdfQueue.add('generate-pdf', data, jobOptions);
}
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });
}
```

## 🌐 API Endpoints

Tất cả endpoints yêu cầu **Admin role**.

### 1. Lấy thống kê tất cả queues

```http
GET /api/v1/queue/stats
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "default": {
      "queue": "default",
      "waiting": 5,
      "active": 2,
      "completed": 100,
      "failed": 3,
      "delayed": 1,
      "total": 111
    },
    "email": {
      "queue": "email",
      "waiting": 10,
      "active": 1,
      "completed": 500,
      "failed": 5,
      "delayed": 0,
      "total": 516
    },
    "notification": {
      "queue": "notification",
      "waiting": 0,
      "active": 0,
      "completed": 200,
      "failed": 2,
      "delayed": 0,
      "total": 202
    }
  }
}
```

### 2. Lấy thống kê queue cụ thể

```http
GET /api/v1/queue/stats/email
Authorization: Bearer YOUR_ADMIN_TOKEN
```

### 3. Thêm Email Job qua API

```http
POST /api/v1/queue/email
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "to": "user@example.com",
  "subject": "Test Email",
  "template": "welcome",
  "data": {
    "name": "John Doe"
  }
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "message": "Email job added successfully",
    "jobId": "123"
  }
}
```

### 4. Thêm Notification Job qua API

```http
POST /api/v1/queue/notification
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "userId": "user-id-123",
  "type": "info",
  "message": "New notification",
  "data": {
    "link": "/dashboard"
  }
}
```

### 5. Dọn dẹp Queue

```http
DELETE /api/v1/queue/clean/email
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "type": "completed",  // "completed" hoặc "failed"
  "grace": 1000         // Grace period in ms (optional)
}
```

## 📊 Monitoring và Debugging

### 1. 🎨 Bull Board UI (Khuyến nghị - giống Laravel Horizon)

**Bull Board** cung cấp giao diện web để monitor và quản lý queues, tương tự Laravel Horizon.

#### Truy cập Bull Board

```
http://localhost:3001/admin/queues
```

**Bảo vệ bằng secret key:**

- Đặt `BULL_BOARD_SECRET_KEY` trong `.env`
- Nếu để trống thì không có bảo vệ

**Cách truy cập:**

```bash
# Cách 1: Qua query string (dễ nhất cho browser)
http://localhost:3001/admin/queues?key=YOUR_SECRET_KEY

# Cách 2: Qua header (dùng curl/Postman)
curl "http://localhost:3001/admin/queues" \
  -H "X-Bull-Board-Key: YOUR_SECRET_KEY"
```

#### Tính năng Bull Board

Bull Board UI cho phép bạn:

- ✅ **Xem tất cả queues** (default, email, notification)
- ✅ **Monitor real-time** - số lượng jobs (waiting, active, completed, failed, delayed)
- ✅ **Xem failed jobs** với error details và stack trace (giống `failed_jobs` table)
- ✅ **Retry failed jobs** - click button để retry từng job hoặc tất cả
- ✅ **Remove jobs** - xóa jobs không cần thiết
- ✅ **View job details** - xem data, logs, attempts, timestamps
- ✅ **Clean queues** - dọn dẹp completed/failed jobs
- ✅ **Pause/Resume queues** - tạm dừng xử lý jobs

#### Screenshot các tính năng

**Dashboard:**

```
┌─────────────────────────────────────────────┐
│ Bull Board - Queue Monitor                  │
├─────────────────────────────────────────────┤
│ Queues:                                     │
│  • default     [5 waiting] [0 active]       │
│  • email       [0 waiting] [2 active]       │
│  • notification [3 waiting] [0 active]      │
└─────────────────────────────────────────────┘
```

**Failed Jobs View:**

```
┌─────────────────────────────────────────────┐
│ Email Queue - Failed Jobs (5)               │
├─────────────────────────────────────────────┤
│ Job #123 | send-email | Failed 2h ago       │
│ Error: SMTP connection timeout              │
│ [Retry] [Remove] [Details]                  │
├─────────────────────────────────────────────┤
│ Job #124 | send-email | Failed 1h ago       │
│ Error: Invalid email address                │
│ [Retry] [Remove] [Details]                  │
└─────────────────────────────────────────────┘
```

---

### 2. Xem Queue Stats qua API

```typescript
// Trong code
const stats = await this.queueService.getQueueStats('email');
console.log('Email queue stats:', stats);

// Hoặc qua API
curl -X GET http://localhost:3001/api/v1/queue/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Xem Job Details (Code)

```typescript
// Lấy job từ queue
const job = await this.emailQueue.getJob(jobId);
console.log('Job data:', job.data);
console.log('Job state:', await job.getState());
console.log('Job progress:', job.progress());
```

### 4. Xem Failed Jobs (Code)

```typescript
// Lấy failed jobs
const failed = await this.emailQueue.getFailed();
failed.forEach((job) => {
  console.log('Failed job:', job.id);
  console.log('Error:', job.failedReason);
  console.log('Stack trace:', job.stacktrace);
  console.log('Attempts:', job.attemptsMade);
});
```

### 5. Retry Failed Job (Code)

```typescript
// Retry một job đã fail
const job = await this.emailQueue.getJob(jobId);
await job.retry();

// Retry tất cả failed jobs
const failed = await this.emailQueue.getFailed();
await Promise.all(failed.map((job) => job.retry()));
```

### 6. Xem Logs

```bash
# Xem logs của app
docker compose logs -f app | grep -i queue

# Hoặc trong code, logs sẽ tự động được ghi bởi Logger
```

### 7. Redis CLI (Low-level)

```bash
# Vào Redis container
docker compose exec redis redis-cli

# Xem keys
KEYS bull:*

# Xem failed jobs của email queue
LRANGE bull:email:failed 0 -1

# Xem chi tiết job
HGETALL bull:email:123

# Xem số lượng failed jobs
LLEN bull:email:failed

# Xem queue length
LLEN bull:email:waiting
```

## 💡 Best Practices

### 1. Job Data Structure

Luôn định nghĩa interface cho job data trong `queue.types.ts`:

```typescript
// queue.types.ts
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
```

**Sử dụng trong service:**

```typescript
import { EmailJobData } from './queue.types';

async addEmailJob(data: EmailJobData, options?: Partial<QueueJobOptions>) {
  // ...
}
```

> **Note:** Types được định nghĩa tập trung trong `queue.types.ts` để dùng chung giữa service, processor và controller.

### 2. Error Handling

Luôn handle errors trong processors:

```typescript
@Process('send-email')
async handleSendEmail(job: Job<EmailJobData>) {
  try {
    // Process job
  } catch (error: any) {
    this.logger.error(
      { jobId: job.id, error: error.message },
      'Job failed',
    );
    // Throw để Bull retry
    throw error;
  }
}
```

### 3. Idempotent Jobs

Đảm bảo jobs có thể chạy nhiều lần mà không gây side effects:

```typescript
@Process('send-email')
async handleSendEmail(job: Job<EmailJobData>) {
  // Kiểm tra xem email đã được gửi chưa
  const sent = await this.checkEmailSent(job.data.to, job.data.subject);
  if (sent) {
    this.logger.info({ jobId: job.id }, 'Email already sent, skipping');
    return { skipped: true };
  }

  // Send email
  await this.sendEmail(job.data);
  await this.markEmailSent(job.data.to, job.data.subject);
}
```

### 4. Job Timeout

Thiết lập timeout cho jobs dài:

```typescript
await this.queueService.addJob(data, {
  timeout: 30000, // 30 giây
});
```

### 5. Job Priority

Sử dụng priority cho jobs quan trọng:

```typescript
// High priority
await this.queueService.addEmailJob(data, { priority: 10 });

// Normal priority
await this.queueService.addEmailJob(data, { priority: 1 });
```

### 6. Rate Limiting

Giới hạn số lượng jobs xử lý đồng thời:

```typescript
// Trong queue.module.ts
BullModule.registerQueue({
  name: 'email',
  settings: {
    maxStalledCount: 1,
    lockDuration: 30000,
  },
  processors: [
    {
      name: 'send-email',
      concurrency: 5, // Chỉ xử lý 5 jobs cùng lúc
    },
  ],
}),
```

### 7. Monitoring với Scheduled Tasks

Thường xuyên kiểm tra queue stats:

```typescript
// Trong scheduled task
@Cron('*/5 * * * *') // Mỗi 5 phút
async checkQueueHealth() {
  const stats = await this.queueService.getAllQueuesStats();

  // Alert nếu có quá nhiều failed jobs
  if (stats.email.failed > 10) {
    await this.sendAlert('Email queue has many failed jobs');
  }
}
```

### 8. So sánh với Laravel Queue

| Laravel                         | NestJS Bull + Bull Board                         |
| ------------------------------- | ------------------------------------------------ |
| `failed_jobs` table             | Redis key: `bull:{queue}:failed` + Bull Board UI |
| `php artisan queue:failed`      | Bull Board UI hoặc `queue.getFailed()`           |
| Laravel Horizon                 | **Bull Board UI** ✅                             |
| `php artisan queue:retry {id}`  | Bull Board UI hoặc `job.retry()`                 |
| `php artisan queue:forget {id}` | Bull Board UI hoặc `job.remove()`                |
| `php artisan queue:work`        | Tự động chạy (processors)                        |

## 🐛 Troubleshooting

### Lỗi: "Redis connection failed"

**Nguyên nhân:** Redis không kết nối được.

**Giải pháp:**

1. **Kiểm tra Redis đang chạy:**

   ```bash
   docker compose ps redis
   ```

2. **Kiểm tra cấu hình:**

   ```env
   REDIS_HOST=redis  # hoặc localhost
   REDIS_PORT=6379
   ```

3. **Test connection:**
   ```bash
   docker compose exec redis redis-cli ping
   # Should return: PONG
   ```

### Lỗi: "Job failed" hoặc "Job stuck"

**Nguyên nhân:** Job xử lý lỗi hoặc timeout.

**Giải pháp:**

1. **Xem logs:**

   ```bash
   docker compose logs -f app | grep -i "job\|queue"
   ```

2. **Xem failed jobs qua Bull Board UI:**
   - Truy cập `http://localhost:3001/admin/queues?key=YOUR_SECRET_KEY`
   - Click vào queue → tab "Failed"
   - Xem error details, stack trace, retry jobs

3. **Hoặc xem qua code:**

   ```typescript
   const failed = await this.emailQueue.getFailed();
   console.log(failed);
   ```

4. **Retry job:**
   ```typescript
   const job = await this.emailQueue.getJob(jobId);
   await job.retry();
   ```

### Jobs không được xử lý

**Nguyên nhân có thể:**

- Processor không được đăng ký
- Queue name không khớp
- Redis connection issue

**Giải pháp:**

1. **Kiểm tra processor đã được đăng ký:**

   ```typescript
   // queue.module.ts
   providers: [
     YourProcessor, // Đảm bảo có trong providers
   ],
   ```

2. **Kiểm tra queue name:**

   ```typescript
   // Queue name phải khớp
   @Processor('email') // Queue name
   // và
   @InjectQueue('email') // Queue name
   ```

3. **Kiểm tra Redis:**
   ```bash
   docker compose exec redis redis-cli
   KEYS bull:*
   ```

### Jobs bị duplicate

**Nguyên nhân:** Job được thêm nhiều lần.

**Giải pháp:**

Sử dụng job ID duy nhất:

```typescript
await this.queueService.addEmailJob(data, {
  jobId: `email-${userId}-${Date.now()}`, // Unique ID
});
```

### Queue quá đầy

**Nguyên nhân:** Quá nhiều jobs được thêm vào.

**Giải pháp:**

1. **Giới hạn queue size:**

   ```typescript
   BullModule.registerQueue({
     name: 'email',
     settings: {
       maxStalledCount: 1,
     },
     limiter: {
       max: 100, // Max 100 jobs per duration
       duration: 1000, // Per 1 second
     },
   }),
   ```

2. **Xóa old jobs:**
   ```typescript
   await this.queueService.cleanCompletedJobs('email', 3600000); // 1 hour
   ```

### Performance Issues

**Giải pháp:**

1. **Tăng concurrency:**

   ```typescript
   processors: [
     {
       name: 'send-email',
       concurrency: 10, // Xử lý 10 jobs cùng lúc
     },
   ],
   ```

2. **Sử dụng multiple workers:**
   - Chạy nhiều instances của app
   - Mỗi instance sẽ xử lý jobs từ cùng queue

## 📖 Tài liệu liên quan

- [Bull Documentation](https://github.com/OptimalBits/bull)
- [NestJS Bull Module](https://docs.nestjs.com/techniques/queues)
- [Redis Documentation](https://redis.io/docs/)
- [Queue Best Practices](https://github.com/OptimalBits/bull/blob/develop/REFERENCE.md)

## 🎯 Ví dụ Use Cases

### 1. Email Sending

```typescript
// Khi user đăng ký
async onUserRegistered(user: User) {
  await this.queueService.addEmailJob({
    to: user.email,
    subject: 'Welcome!',
    template: 'welcome',
    data: { name: user.firstName },
  });
}
```

### 2. Image Processing

```typescript
// Upload image
async uploadImage(file: Express.Multer.File) {
  const imageId = await this.saveImage(file);

  // Process image in background
  await this.queueService.addJob({
    type: 'process-image',
    imageId: imageId,
  });
}
```

### 3. Report Generation

```typescript
// Generate report
async generateReport(userId: string) {
  await this.queueService.addJob({
    type: 'generate-report',
    userId: userId,
    format: 'pdf',
  }, {
    delay: 5000, // Delay 5 seconds
  });
}
```

### 4. Data Synchronization

```typescript
// Sync data với external service
async syncData() {
  await this.queueService.addJob({
    type: 'sync-data',
    source: 'external-api',
  }, {
    repeat: {
      cron: '0 */6 * * *', // Mỗi 6 giờ
    },
  });
}
```
