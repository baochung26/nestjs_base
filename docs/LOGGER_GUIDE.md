# Hướng dẫn Sử dụng Logger với Pino

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Cấu hình](#cấu-hình)
- [Correlation ID](#correlation-id)
- [Sử dụng Logger trong Code](#sử-dụng-logger-trong-code)
- [Log Levels](#log-levels)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Tổng quan

Dự án sử dụng **Pino** - một logger nhanh và hiệu quả cho Node.js. Logger được tích hợp với:
- ✅ Correlation ID để trace requests
- ✅ Request/Response logging tự động
- ✅ Structured logging (JSON format)
- ✅ Pretty printing trong development
- ✅ Sanitization của sensitive data

## ⚙️ Cấu hình

### Logger Module

Logger được cấu hình trong `infrastructure/logger/logger.module.ts`:

- **Development:** Pretty printing với colors
- **Production:** JSON format cho log aggregation
- **Auto correlation ID:** Tự động generate hoặc sử dụng từ header

### Environment Variables

```env
NODE_ENV=development  # hoặc production
```

## 🔍 Correlation ID

### Tự động Generate

Mỗi request sẽ tự động được gán một correlation ID:
- Nếu client gửi `x-correlation-id` header, sẽ sử dụng ID đó
- Nếu không, sẽ tự động generate UUID mới
- Correlation ID được trả về trong response header `x-correlation-id`

### Sử dụng trong Code

```typescript
import { Logger } from 'nestjs-pino';

@Injectable()
export class YourService {
  private readonly logger = new Logger(YourService.name);

  async doSomething(correlationId: string) {
    this.logger.info(
      { correlationId, action: 'doSomething' },
      'Starting operation',
    );
    
    // Your code here
    
    this.logger.info(
      { correlationId, action: 'doSomething' },
      'Operation completed',
    );
  }
}
```

### Trace Request qua Services

```typescript
// Controller
@Get(':id')
async findOne(@Param('id') id: string, @Req() req: Request) {
  const correlationId = req.id || req.headers['x-correlation-id'];
  return this.service.findOne(id, correlationId);
}

// Service
async findOne(id: string, correlationId: string) {
  this.logger.info({ correlationId, userId: id }, 'Finding user');
  // ...
}
```

## 📚 Sử dụng Logger trong Code

### 1. Inject Logger vào Service

```typescript
import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

@Injectable()
export class YourService {
  private readonly logger = new Logger(YourService.name);

  async yourMethod() {
    this.logger.info('Info message');
    this.logger.debug('Debug message');
    this.logger.warn('Warning message');
    this.logger.error('Error message');
  }
}
```

### 2. Structured Logging

```typescript
// Với context data
this.logger.info(
  { userId: '123', action: 'login' },
  'User logged in',
);

// Với error
this.logger.error(
  { userId: '123', error: error.message, stack: error.stack },
  'Failed to process',
);
```

### 3. Log Levels

```typescript
// Debug - Chi tiết cho development
this.logger.debug({ data }, 'Debug information');

// Info - Thông tin quan trọng
this.logger.info({ userId }, 'User created');

// Warn - Cảnh báo
this.logger.warn({ email }, 'Email already exists');

// Error - Lỗi
this.logger.error({ error: error.message }, 'Operation failed');
```

### 4. Log với Correlation ID

```typescript
// Lấy correlation ID từ request
const correlationId = request.id || request.headers['x-correlation-id'];

this.logger.info(
  { correlationId, userId: '123' },
  'Processing user request',
);
```

## 📊 Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| `debug` | Chi tiết cho debugging | Variable values, flow details |
| `info` | Thông tin quan trọng | User actions, successful operations |
| `warn` | Cảnh báo | Deprecated features, validation warnings |
| `error` | Lỗi | Exceptions, failed operations |
| `fatal` | Lỗi nghiêm trọng | System failures |

## 💡 Best Practices

### 1. Structured Logging

✅ **Good:**
```typescript
this.logger.info(
  { userId: user.id, email: user.email, action: 'login' },
  'User logged in successfully',
);
```

❌ **Bad:**
```typescript
this.logger.info(`User ${user.id} with email ${user.email} logged in`);
```

### 2. Include Correlation ID

✅ **Good:**
```typescript
this.logger.info(
  { correlationId: req.id, userId: id },
  'Finding user',
);
```

❌ **Bad:**
```typescript
this.logger.info('Finding user');
```

### 3. Sanitize Sensitive Data

Logger tự động sanitize:
- `password`
- `token`
- `access_token`

Nhưng bạn nên cẩn thận với các field khác:
```typescript
// ❌ Bad
this.logger.info({ creditCard: user.creditCard }, 'User data');

// ✅ Good
this.logger.info({ userId: user.id }, 'User data');
```

### 4. Log Context, Not Just Messages

✅ **Good:**
```typescript
this.logger.error(
  {
    correlationId,
    userId,
    error: {
      message: error.message,
      code: error.code,
      stack: error.stack,
    },
  },
  'Failed to process payment',
);
```

### 5. Use Appropriate Log Levels

```typescript
// Debug - Chi tiết
this.logger.debug({ query, params }, 'Executing database query');

// Info - Thông tin quan trọng
this.logger.info({ userId }, 'User created successfully');

// Warn - Cảnh báo nhưng không phải lỗi
this.logger.warn({ email }, 'Email already exists, skipping');

// Error - Lỗi thực sự
this.logger.error({ error: error.message }, 'Database connection failed');
```

## 🔍 Request Logging

### Tự động Logging

LoggingInterceptor tự động log:
- **Incoming requests:** Method, URL, body, query, params
- **Outgoing responses:** Status code, duration
- **Errors:** Error details với stack trace

### Log Format

**Development (Pretty):**
```
[2024-01-19 10:30:00] INFO: Incoming POST /api/auth/login
  correlationId: "abc-123"
  method: "POST"
  url: "/api/auth/login"
  body: { email: "user@example.com", password: "***" }
```

**Production (JSON):**
```json
{
  "level": 30,
  "time": 1705657800000,
  "pid": 12345,
  "hostname": "server",
  "correlationId": "abc-123",
  "method": "POST",
  "url": "/api/auth/login",
  "statusCode": 200,
  "duration": "45ms",
  "msg": "Outgoing POST /api/auth/login 200"
}
```

## 🐛 Troubleshooting

### Logs không hiển thị

**Nguyên nhân:** Logger chưa được inject đúng cách.

**Giải pháp:**
```typescript
// Đảm bảo LoggerModule đã được import trong AppModule
imports: [LoggerModule, ...]
```

### Correlation ID không có

**Nguyên nhân:** Middleware chưa được apply.

**Giải pháp:**
```typescript
// Đảm bảo CorrelationIdMiddleware đã được apply
configure(consumer: MiddlewareConsumer) {
  consumer.apply(CorrelationIdMiddleware).forRoutes('*');
}
```

### Logs quá nhiều trong Production

**Giải pháp:** Điều chỉnh log level trong config:

```typescript
level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
```

### Performance Issues

Pino rất nhanh, nhưng nếu có vấn đề:
- Sử dụng `pino-pretty` chỉ trong development
- Trong production, output JSON để log aggregation tools xử lý

## 📖 Ví dụ Sử dụng

### Service với Logger

```typescript
import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  async processPayment(paymentData: any, correlationId: string) {
    this.logger.info(
      { correlationId, amount: paymentData.amount },
      'Processing payment',
    );

    try {
      // Process payment
      const result = await this.chargeCard(paymentData);

      this.logger.info(
        { correlationId, transactionId: result.id },
        'Payment processed successfully',
      );

      return result;
    } catch (error) {
      this.logger.error(
        {
          correlationId,
          error: error.message,
          stack: error.stack,
        },
        'Payment processing failed',
      );
      throw error;
    }
  }
}
```

### Controller với Correlation ID

```typescript
import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { Logger } from 'nestjs-pino';

@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  @Get(':id')
  async getPayment(@Param('id') id: string, @Req() req: Request) {
    const correlationId = req.id || req.headers['x-correlation-id'];
    
    this.logger.info(
      { correlationId, paymentId: id },
      'Getting payment details',
    );

    return this.paymentService.getPayment(id, correlationId);
  }
}
```

## 🔗 Tài liệu liên quan

- [Pino Documentation](https://getpino.io/)
- [nestjs-pino](https://github.com/iamolegga/nestjs-pino)
- [Structured Logging Best Practices](https://www.datadoghq.com/blog/log-management-best-practices/)
