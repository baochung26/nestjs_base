# Hướng dẫn Sử dụng Scheduler Module

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Cấu hình](#cấu-hình)
- [Scheduled Tasks](#scheduled-tasks)
- [Tạo Scheduled Task Mới](#tạo-scheduled-task-mới)
- [Cron Expressions](#cron-expressions)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Tổng quan

Scheduler Module sử dụng **@nestjs/schedule** để thực hiện các công việc định kỳ (cron jobs). Module bao gồm:

- ✅ **Cleanup Tasks** - Dọn dẹp queue jobs, cache, inactive users
- ✅ **Retry Tasks** - Tự động retry failed jobs
- ✅ **Sync Tasks** - Đồng bộ dữ liệu, statistics, health checks

## ⚙️ Cấu hình

### Scheduler Module

Scheduler được cấu hình trong `src/infrastructure/scheduler/scheduler.module.ts`:

```typescript
@Module({
  imports: [ScheduleModule.forRoot(), QueueModule, CacheModule, UsersModule],
  providers: [CleanupScheduler, RetryScheduler, SyncScheduler],
})
export class SchedulerModule {}
```

### Environment Variables

Không cần cấu hình thêm, scheduler sử dụng các module đã có sẵn.

## 📅 Scheduled Tasks

### 1. Cleanup Tasks (`CleanupScheduler`)

#### Cleanup Completed Queue Jobs

- **Schedule:** Mỗi giờ (`@Cron(CronExpression.EVERY_HOUR)`)
- **Mô tả:** Xóa các completed jobs cũ hơn 1 giờ từ tất cả queues
- **Queues:** default, email, notification

```typescript
@Cron(CronExpression.EVERY_HOUR)
async cleanupCompletedJobs() {
  // Cleanup completed jobs older than 1 hour
}
```

#### Cleanup Failed Queue Jobs

- **Schedule:** Hàng ngày lúc 2:00 AM (`@Cron('0 2 * * *')`)
- **Mô tả:** Xóa các failed jobs cũ hơn 24 giờ
- **Queues:** default, email, notification

```typescript
@Cron('0 2 * * *')
async cleanupFailedJobs() {
  // Cleanup failed jobs older than 24 hours
}
```

#### Cleanup Cache

- **Schedule:** Hàng ngày lúc 3:00 AM (`@Cron('0 3 * * *')`)
- **Mô tả:** Cache tự động expire dựa trên TTL

```typescript
@Cron('0 3 * * *')
async cleanupCache() {
  // Cache cleanup (TTL-based)
}
```

#### Cleanup Inactive Users

- **Schedule:** Hàng tháng ngày 1 lúc 4:00 AM (`@Cron('0 4 1 * *')`)
- **Mô tả:** Xóa inactive users không hoạt động hơn 6 tháng

```typescript
@Cron('0 4 1 * *')
async cleanupInactiveUsers() {
  // Delete inactive users older than 6 months
}
```

#### Cleanup Old Files

- **Schedule:** Chủ nhật hàng tuần lúc 5:00 AM (`@Cron('0 5 * * 0')`)
- **Mô tả:** Dọn dẹp các file cũ (logs, uploads, etc.)

```typescript
@Cron('0 5 * * 0')
async cleanupOldFiles() {
  // Cleanup old files
}
```

### 2. Retry Tasks (`RetryScheduler`)

#### Retry Failed Email Jobs

- **Schedule:** Mỗi 30 phút (`@Cron('*/30 * * * *')`)
- **Mô tả:** Retry failed email jobs với max 3 attempts và max age 24 hours

```typescript
@Cron('*/30 * * * *')
async retryFailedEmailJobs() {
  // Retry failed email jobs
}
```

#### Retry Failed Notification Jobs

- **Schedule:** Mỗi 15 phút (`@Cron('*/15 * * * *')`)
- **Mô tả:** Retry failed notification jobs với max 3 attempts và max age 12 hours

```typescript
@Cron('*/15 * * * *')
async retryFailedNotificationJobs() {
  // Retry failed notification jobs
}
```

#### Retry Failed Default Queue Jobs

- **Schedule:** Mỗi giờ (`@Cron(CronExpression.EVERY_HOUR)`)
- **Mô tả:** Retry failed default queue jobs với max 5 attempts và max age 48 hours

```typescript
@Cron(CronExpression.EVERY_HOUR)
async retryFailedDefaultJobs() {
  // Retry failed default queue jobs
}
```

### 3. Sync Tasks (`SyncScheduler`)

#### Sync User Statistics

- **Schedule:** Mỗi 5 phút (`@Cron('*/5 * * * *')`)
- **Mô tả:** Đồng bộ thống kê users (total, active, inactive) và cache

```typescript
@Cron('*/5 * * * *')
async syncUserStatistics() {
  // Sync user statistics
}
```

#### Sync Cache with Database

- **Schedule:** Hàng ngày lúc midnight (`@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)`)
- **Mô tả:** Warm up cache với frequently accessed data

```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async syncCacheWithDatabase() {
  // Warm up cache
}
```

#### Sync External Services

- **Schedule:** Mỗi giờ (`@Cron(CronExpression.EVERY_HOUR)`)
- **Mô tả:** Đồng bộ với external services (APIs, payment gateways, etc.)

```typescript
@Cron(CronExpression.EVERY_HOUR)
async syncExternalServices() {
  // Sync with external services
}
```

#### Health Check Sync

- **Schedule:** Mỗi phút (`@Cron(CronExpression.EVERY_MINUTE)`)
- **Mô tả:** Kiểm tra health status của database và cache

```typescript
@Cron(CronExpression.EVERY_MINUTE)
async healthCheckSync() {
  // Health check
}
```

#### Data Backup Sync

- **Schedule:** Hàng ngày lúc 1:00 AM (`@Cron('0 1 * * *')`)
- **Mô tả:** Backup dữ liệu (database, files, etc.)

```typescript
@Cron('0 1 * * *')
async dataBackupSync() {
  // Data backup
}
```

## 🔧 Tạo Scheduled Task Mới

### Bước 1: Tạo Scheduler Service

Tạo file mới trong `src/infrastructure/scheduler/tasks/`:

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';

@Injectable()
export class YourScheduler {
  private readonly logger = new Logger(YourScheduler.name);

  @Cron('0 0 * * *') // Chạy mỗi ngày lúc midnight
  async yourScheduledTask() {
    this.logger.info('Starting your scheduled task');

    try {
      // Your task logic here
      this.logger.info('Your scheduled task completed');
    } catch (error: any) {
      this.logger.error(
        { error: error.message },
        'Error in your scheduled task',
      );
    }
  }
}
```

### Bước 2: Đăng ký trong SchedulerModule

Thêm vào `scheduler.module.ts`:

```typescript
import { YourScheduler } from './tasks/your.scheduler';

@Module({
  providers: [
    CleanupScheduler,
    RetryScheduler,
    SyncScheduler,
    YourScheduler, // Thêm scheduler mới
  ],
})
export class SchedulerModule {}
```

## ⏰ Cron Expressions

### CronExpression Constants

NestJS cung cấp các constants tiện lợi:

```typescript
CronExpression.EVERY_SECOND; // * * * * * *
CronExpression.EVERY_5_SECONDS; // */5 * * * * *
CronExpression.EVERY_MINUTE; // * * * * *
CronExpression.EVERY_5_MINUTES; // */5 * * * *
CronExpression.EVERY_HOUR; // 0 * * * *
CronExpression.EVERY_DAY_AT_1AM; // 0 1 * * *
CronExpression.EVERY_DAY_AT_MIDNIGHT; // 0 0 * * *
CronExpression.EVERY_WEEK; // 0 0 * * 0
CronExpression.EVERY_MONTH; // 0 0 1 * *
```

### Custom Cron Expressions

Format: `second minute hour day month day-of-week`

```typescript
// Mỗi 30 phút
@Cron('*/30 * * * *')

// Mỗi ngày lúc 2:00 AM
@Cron('0 2 * * *')

// Mỗi thứ 2 lúc 9:00 AM
@Cron('0 9 * * 1')

// Ngày 1 hàng tháng lúc midnight
@Cron('0 0 1 * *')

// Mỗi 15 phút từ 9 AM đến 5 PM
@Cron('*/15 9-17 * * *')
```

### Cron Expression Examples

| Expression       | Description                |
| ---------------- | -------------------------- |
| `*/5 * * * *`    | Mỗi 5 phút                 |
| `0 */2 * * *`    | Mỗi 2 giờ                  |
| `0 0 * * *`      | Mỗi ngày lúc midnight      |
| `0 0 * * 0`      | Mỗi chủ nhật               |
| `0 0 1 * *`      | Ngày 1 hàng tháng          |
| `0 9-17 * * 1-5` | 9 AM - 5 PM, thứ 2 - thứ 6 |
| `0 0,12 * * *`   | Lúc midnight và noon       |

## 💡 Best Practices

### 1. Error Handling

Luôn wrap task logic trong try-catch:

```typescript
@Cron(CronExpression.EVERY_HOUR)
async yourTask() {
  try {
    // Task logic
  } catch (error: any) {
    this.logger.error(
      { error: error.message },
      'Error in scheduled task',
    );
    // Don't throw - let scheduler continue
  }
}
```

### 2. Logging

Sử dụng structured logging:

```typescript
this.logger.info({ count: items.length }, 'Task completed');
this.logger.error({ error: error.message }, 'Task failed');
```

### 3. Idempotency

Đảm bảo tasks có thể chạy nhiều lần an toàn:

```typescript
@Cron(CronExpression.EVERY_HOUR)
async syncData() {
  // Check if already synced
  const lastSync = await this.getLastSyncTime();
  if (Date.now() - lastSync < 3600000) {
    return; // Already synced
  }

  // Perform sync
  await this.performSync();
}
```

### 4. Resource Management

Giới hạn resource usage:

```typescript
@Cron(CronExpression.EVERY_HOUR)
async processData() {
  const batchSize = 100;
  let offset = 0;

  while (true) {
    const items = await this.getItems(offset, batchSize);
    if (items.length === 0) break;

    await this.processBatch(items);
    offset += batchSize;
  }
}
```

### 5. Timeout Protection

Thiết lập timeout cho long-running tasks:

```typescript
@Cron(CronExpression.EVERY_HOUR)
async longRunningTask() {
  const timeout = setTimeout(() => {
    this.logger.warn('Task timeout');
  }, 300000); // 5 minutes

  try {
    await this.performTask();
  } finally {
    clearTimeout(timeout);
  }
}
```

## 🐛 Troubleshooting

### Task không chạy

**Nguyên nhân:** SchedulerModule chưa được import hoặc task chưa được đăng ký.

**Giải pháp:**

1. Đảm bảo `SchedulerModule` đã được import trong `AppModule`
2. Đảm bảo scheduler service đã được thêm vào `providers` trong `SchedulerModule`
3. Kiểm tra cron expression có đúng không

### Task chạy nhiều lần

**Nguyên nhân:** Multiple instances của app đang chạy.

**Giải pháp:**

- Sử dụng distributed lock (Redis, database)
- Chỉ chạy scheduler trên một instance

### Task quá lâu

**Nguyên nhân:** Task xử lý quá nhiều data.

**Giải pháp:**

- Chia nhỏ task thành batches
- Sử dụng queue thay vì scheduler cho heavy tasks
- Thiết lập timeout

### Memory Issues

**Nguyên nhân:** Task sử dụng quá nhiều memory.

**Giải pháp:**

- Process data in batches
- Clean up resources sau khi xử lý
- Monitor memory usage

## 📖 Ví dụ Sử dụng

### Complete Scheduler Example

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';
import { QueueService } from '../../queue/queue.service';

@Injectable()
export class ReportScheduler {
  private readonly logger = new Logger(ReportScheduler.name);

  constructor(private queueService: QueueService) {}

  @Cron('0 0 * * *') // Daily at midnight
  async generateDailyReports() {
    this.logger.info('Starting daily report generation');

    try {
      const users = await this.getActiveUsers();

      for (const user of users) {
        await this.queueService.addJob({
          type: 'generate-report',
          userId: user.id,
          date: new Date(),
        });
      }

      this.logger.info(
        { count: users.length },
        'Daily reports queued successfully',
      );
    } catch (error: any) {
      this.logger.error(
        { error: error.message },
        'Error generating daily reports',
      );
    }
  }

  private async getActiveUsers() {
    // Get active users logic
    return [];
  }
}
```

## 🔗 Tài liệu liên quan

- [NestJS Schedule Module](https://docs.nestjs.com/techniques/task-scheduling)
- [Cron Expression Guide](https://crontab.guru/)
- [Node Cron](https://github.com/node-cron/node-cron)
