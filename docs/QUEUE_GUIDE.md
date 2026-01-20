# Hướng dẫn Sử dụng Queue System

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc Queue](#kiến-trúc-queue)
- [Cấu hình](#cấu-hình)
- [Sử dụng QueueService](#sử-dụng-queueservice)
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
- ✅ Monitoring và statistics
- ✅ Job scheduling

### Queues có sẵn

| Queue Name | Mô tả | Processor |
|------------|-------|-----------|
| `default` | Queue mặc định cho các job chung | `DefaultQueueProcessor` |
| `email` | Queue cho email jobs | `EmailQueueProcessor` |
| `notification` | Queue cho notification jobs | `NotificationQueueProcessor` |

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

**Options mặc định:**
- `attempts: 3` - Retry 3 lần nếu fail
- `backoff: exponential` - Exponential backoff với delay 2s

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
async processData(data: any) {
  await this.queueService.addJob(
    {
      type: 'data-processing',
      payload: data,
    },
    {
      attempts: 5,
      delay: 5000,        // Delay 5 giây trước khi xử lý
      priority: 1,        // Priority (higher = processed first)
    },
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

## 🔧 Tạo Processors Mới

### Bước 1: Tạo Processor

Tạo file mới hoặc thêm vào `queue.processor.ts`:

```typescript
import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

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

interface YourJobData {
  // Define your job data structure
  field1: string;
  field2: number;
}
```

### Bước 2: Đăng ký Queue trong Module

Thêm queue mới vào `queue.module.ts`:

```typescript
BullModule.registerQueue({
  name: 'your-queue-name',
}),
```

### Bước 3: Thêm Processor vào Providers

```typescript
providers: [
  QueueService,
  DefaultQueueProcessor,
  EmailQueueProcessor,
  NotificationQueueProcessor,
  YourQueueProcessor, // Thêm processor mới
],
```

### Bước 4: Thêm Method vào QueueService

```typescript
@InjectQueue('your-queue-name') 
private yourQueue: Queue,

async addYourJob(data: YourJobData, options?: any) {
  return this.yourQueue.add('your-job-name', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    ...options,
  });
}
```

### Ví dụ: PDF Generation Queue

```typescript
// queue.processor.ts
@Processor('pdf')
export class PdfQueueProcessor {
  private readonly logger = new Logger(PdfQueueProcessor.name);

  @Process('generate-pdf')
  async handleGeneratePdf(
    job: Job<{ userId: string; documentId: string }>,
  ) {
    this.logger.log(`Generating PDF for job ${job.id}`);
    
    try {
      // Generate PDF logic
      const pdfPath = await this.generatePdf(job.data);
      
      this.logger.log(`PDF generated successfully: ${pdfPath}`);
      return {
        success: true,
        jobId: job.id,
        pdfPath: pdfPath,
      };
    } catch (error: any) {
      this.logger.error(`PDF generation failed: ${error.message}`);
      throw error;
    }
  }

  private async generatePdf(data: { userId: string; documentId: string }) {
    // PDF generation logic
    return '/path/to/generated.pdf';
  }
}

// queue.service.ts
async addPdfJob(data: { userId: string; documentId: string }) {
  return this.pdfQueue.add('generate-pdf', data, {
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
GET /api/queue/stats
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
GET /api/queue/stats/email
Authorization: Bearer YOUR_ADMIN_TOKEN
```

### 3. Thêm Email Job qua API

```http
POST /api/queue/email
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
POST /api/queue/notification
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
DELETE /api/queue/clean/email
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "type": "completed",  // "completed" hoặc "failed"
  "grace": 1000         // Grace period in ms (optional)
}
```

## 📊 Monitoring và Debugging

### 1. Xem Queue Stats

```typescript
// Trong code
const stats = await this.queueService.getQueueStats('email');
console.log('Email queue stats:', stats);

// Hoặc qua API
curl -X GET http://localhost:3000/api/queue/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Xem Job Details

```typescript
// Lấy job từ queue
const job = await this.emailQueue.getJob(jobId);
console.log('Job data:', job.data);
console.log('Job state:', await job.getState());
console.log('Job progress:', job.progress());
```

### 3. Xem Failed Jobs

```typescript
// Lấy failed jobs
const failed = await this.emailQueue.getFailed();
failed.forEach(job => {
  console.log('Failed job:', job.id);
  console.log('Error:', job.failedReason);
});
```

### 4. Retry Failed Job

```typescript
// Retry một job đã fail
const job = await this.emailQueue.getJob(jobId);
await job.retry();
```

### 5. Xem Logs

```bash
# Xem logs của app
docker compose logs -f app | grep -i queue

# Hoặc trong code, logs sẽ tự động được ghi bởi Logger
```

### 6. Redis CLI

```bash
# Vào Redis container
docker compose exec redis redis-cli

# Xem keys
KEYS bull:*

# Xem queue data
HGETALL bull:email:123

# Xem queue length
LLEN bull:email:waiting
```

## 💡 Best Practices

### 1. Job Data Structure

Luôn định nghĩa interface cho job data:

```typescript
interface EmailJobData {
  to: string;
  subject: string;
  template?: string;
  data?: any;
}

async addEmailJob(data: EmailJobData) {
  // ...
}
```

### 2. Error Handling

Luôn handle errors trong processors:

```typescript
@Process('send-email')
async handleSendEmail(job: Job<EmailJobData>) {
  try {
    // Process job
  } catch (error) {
    this.logger.error(`Job ${job.id} failed:`, error);
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
    this.logger.log('Email already sent, skipping');
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

### 7. Monitoring

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

2. **Xem failed jobs:**
   ```typescript
   const failed = await this.emailQueue.getFailed();
   console.log(failed);
   ```

3. **Retry job:**
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
