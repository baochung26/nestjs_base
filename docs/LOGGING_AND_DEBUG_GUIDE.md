# Hướng dẫn Hệ thống Logging và Debug

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Kiến trúc Logging](#kiến-trúc-logging)
- [Các thành phần Logging](#các-thành-phần-logging)
- [Cách sử dụng Logger](#cách-sử-dụng-logger)
- [Xem Logs](#xem-logs)
- [Hướng dẫn Debug khi có Error](#hướng-dẫn-debug-khi-có-error)
- [Correlation ID](#correlation-id)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Tổng quan

Hệ thống sử dụng **Pino** (thông qua `nestjs-pino`) làm logger chính với các đặc điểm:

| Đặc điểm        | Mô tả                                    |
| --------------- | ---------------------------------------- |
| **Logger**      | Pino (nestjs-pino)                       |
| **Output**      | Console/stdout (không ghi file)          |
| **Development** | pino-pretty (format đẹp, có màu)         |
| **Production**  | JSON format (stdout)                     |
| **Log Level**   | Development: `debug`, Production: `info` |

---

## 🏗️ Kiến trúc Logging

```
┌─────────────────────────────────────────────────────────────────┐
│                        HTTP Request                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  CorrelationIdMiddleware                                         │
│  - Gắn/generate x-correlation-id cho mỗi request                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  LoggingInterceptor (Request)                                    │
│  - Log: method, url, body, query, params, correlationId          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Controller / Service / Handler                                  │
│  - Xử lý logic                                                   │
│  - Có thể throw Exception                                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
            ┌──────────────┐        ┌──────────────┐
            │   Success    │        │   Error      │
            └──────────────┘        └──────────────┘
                    │                       │
                    ▼                       ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│  LoggingInterceptor         │  │  LoggingInterceptor         │
│  - Log: statusCode, duration│  │  - Log: error, stack trace  │
└─────────────────────────────┘  └─────────────────────────────┘
                    │                       │
                    ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Exception Filters (nếu có error)                                │
│  - HttpExceptionFilter: xử lý HttpException                      │
│  - AllExceptionsFilter: xử lý mọi exception còn lại              │
│  - Log qua console.error (development)                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Pino Logger → stdout (console)                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Các thành phần Logging

### 1. LoggerModule

**File:** `src/infrastructure/logger/logger.module.ts`

| Cấu hình         | Development                  | Production              |
| ---------------- | ---------------------------- | ----------------------- |
| **Level**        | `debug`                      | `info`                  |
| **Transport**    | pino-pretty (console có màu) | undefined (JSON stdout) |
| **Serializers**  | req, res, err                | req, res, err           |
| **Custom props** | correlationId                | correlationId           |

**Log Level theo HTTP Status:**

- `info`: statusCode < 400
- `warn`: 400 ≤ statusCode < 500
- `error`: statusCode ≥ 500 hoặc có exception

### 2. LoggingInterceptor

**File:** `src/common/interceptors/logging.interceptor.ts`

Tự động log mỗi request:

- **Incoming:** method, url, body (đã sanitize password/token), query, params, correlationId
- **Outgoing (success):** method, url, statusCode, correlationId, duration (ms)
- **Outgoing (error):** method, url, statusCode, duration, error.message, error.stack

**Sanitize:** Các field `password`, `token`, `access_token` được thay bằng `***`

### 3. AllExceptionsFilter

**File:** `src/common/filters/all-exceptions.filter.ts`

- Bắt **mọi exception** chưa được xử lý
- Trả response JSON chuẩn `ApiErrorResponseDto`
- **Log:** Chỉ trong development, dùng `console.error('Exception caught:', exception)`

### 4. HttpExceptionFilter

**File:** `src/common/filters/http-exception.filter.ts`

- Bắt **HttpException** (400, 401, 404, etc.)
- Trả response JSON chuẩn
- Không log (để LoggingInterceptor xử lý)

### 5. Logger Util

**File:** `src/common/utils/logger.util.ts`

- `InjectLogger()`: Decorator inject Pino Logger
- `BaseService`: Base class có sẵn logger

---

## 💻 Cách sử dụng Logger

### Cách 1: NestJS Logger (phổ biến)

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  async create(data: CreateUserDto) {
    this.logger.debug({ email: data.email }, 'Creating new user');

    try {
      const user = await this.repository.save(data);
      this.logger.log(`User created: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error({ error: error.message }, 'Failed to create user');
      throw error;
    }
  }
}
```

### Cách 2: Inject Pino Logger

```typescript
import { Injectable } from '@nestjs/common';
import { InjectLogger } from '../common/utils/logger.util';
import { Logger } from 'nestjs-pino';

@Injectable()
export class MyService {
  constructor(@InjectLogger() private readonly logger: Logger) {}

  doSomething() {
    this.logger.info('Info message');
    this.logger.debug({ data: 'value' }, 'Debug with context');
    this.logger.warn('Warning message');
    this.logger.error({ err: error }, 'Error message');
  }
}
```

### Log Levels

| Level                            | Khi dùng                                   |
| -------------------------------- | ------------------------------------------ |
| `logger.debug()`                 | Chi tiết debug, chỉ hiện trong development |
| `logger.log()` / `logger.info()` | Thông tin bình thường                      |
| `logger.warn()`                  | Cảnh báo (validation fail, retry, etc.)    |
| `logger.error()`                 | Lỗi cần xử lý                              |

---

## 👀 Xem Logs

### Chạy Local

```bash
npm run start:dev
```

Logs hiển thị trực tiếp trên terminal với pino-pretty (có màu, dễ đọc).

### Chạy Docker

```bash
docker compose up -d
docker compose logs -f app
```

- `-f`: follow (xem real-time)
- Bỏ `app` để xem logs tất cả services

### Chạy Production

```bash
npm run start:prod
```

Logs ra stdout dạng JSON. Có thể pipe vào file:

```bash
node dist/main.js > app.log 2>&1
# Hoặc dùng PM2, systemd, etc. để quản lý logs
```

---

## 🔧 Hướng dẫn Debug khi có Error

### Bước 1: Xác định Correlation ID

Mỗi request có `x-correlation-id` trong response header. Dùng để trace request qua các logs.

**Ví dụ:** Gọi API và lấy correlation ID từ response header:

```bash
curl -v http://localhost:3001/api/v1/users
# Xem header: x-correlation-id: abc-123-def
```

### Bước 2: Tìm Log liên quan

1. **LoggingInterceptor** sẽ log:
   - `Incoming GET /api/v1/users - correlationId=abc-123-def - ...`
   - `Error GET /api/v1/users 500` (nếu có lỗi)
   - Hoặc `Outgoing GET /api/v1/users 200 - duration=50ms`

2. **Search logs** với correlation ID:
   ```bash
   docker compose logs app 2>&1 | grep "abc-123-def"
   ```

### Bước 3: Phân tích Error Log

Khi có error, LoggingInterceptor log:

```
Error POST /api/v1/auth/login 500
{
  correlationId: "abc-123-def",
  method: "POST",
  url: "/api/v1/auth/login",
  statusCode: 500,
  duration: "120ms",
  error: {
    message: "Connection refused",
    stack: "Error: Connection refused\n    at ..."
  }
}
```

**Chú ý:**

- `error.message`: Nguyên nhân ngắn gọn
- `error.stack`: Stack trace - xem dòng code gây lỗi

### Bước 4: AllExceptionsFilter (Development)

Trong development, AllExceptionsFilter thêm:

```
Exception caught: [Full exception object]
```

Xem toàn bộ exception object để hiểu context.

### Bước 5: Thêm Log tạm để debug

```typescript
// Trong service/controller cần debug
this.logger.debug(
  {
    userId: id,
    data: someVariable,
  },
  'Debug point - check value',
);
```

Chạy với `NODE_ENV=development` để thấy `debug` logs.

### Bước 6: Kiểm tra Response Body

API trả về format chuẩn khi có lỗi:

```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Chi tiết lỗi (nếu có)",
  "path": "/api/v1/auth/login",
  "timestamp": "2026-01-29T..."
}
```

### Checklist Debug

- [ ] Lấy `x-correlation-id` từ response header
- [ ] Search logs với correlation ID
- [ ] Xem `error.message` và `error.stack` trong log
- [ ] Kiểm tra `path` - endpoint nào gây lỗi
- [ ] Kiểm tra `statusCode` - loại lỗi (4xx vs 5xx)
- [ ] Thêm `logger.debug()` nếu cần trace sâu hơn
- [ ] Kiểm tra database/Redis connection (nếu lỗi connection)

---

## 🔗 Correlation ID

### Mục đích

- Theo dõi 1 request qua toàn bộ luồng xử lý
- Ghép các log của cùng 1 request
- Debug khi có nhiều request đồng thời

### Cách hoạt động

1. **Client gửi** (tùy chọn): `X-Correlation-Id: my-trace-id`
2. **Nếu không có:** Middleware/Logger generate UUID
3. **Response header:** Luôn trả về `X-Correlation-Id`
4. **Logs:** Mỗi log có `correlationId`

### Sử dụng khi gọi API

```javascript
// Frontend/Client
fetch('/api/v1/users', {
  headers: {
    'X-Correlation-Id': 'my-custom-trace-123', // Optional
  },
});
```

---

## ✅ Best Practices

### 1. Log có cấu trúc

```typescript
// ✅ Tốt - có context
this.logger.log({ userId: user.id, action: 'login' }, 'User logged in');

// ❌ Tránh - thiếu context
this.logger.log('User logged in');
```

### 2. Không log dữ liệu nhạy cảm

- Đã có: LoggingInterceptor sanitize `password`, `token`, `access_token`
- Tự log: **Không** log password, token, credit card, etc.

### 3. Dùng đúng log level

- `debug`: Chi tiết khi develop
- `log`/`info`: Sự kiện bình thường
- `warn`: Cần chú ý nhưng chưa lỗi
- `error`: Lỗi cần xử lý

### 4. Log khi throw exception

```typescript
try {
  await this.externalService.call();
} catch (error) {
  this.logger.error(
    {
      error: error.message,
      stack: error.stack,
    },
    'External service failed',
  );
  throw new InternalServerErrorException('Service unavailable');
}
```

### 5. Correlation ID trong log

Khi log từ service, có thể nhận correlationId từ request:

```typescript
// Trong controller
const correlationId = req.id || req.headers['x-correlation-id'];
this.logger.log({ correlationId, ... }, 'Processing...');
```

---

## 🔍 Troubleshooting

### Không thấy logs

**Nguyên nhân:** Log level quá cao  
**Giải pháp:**

- Development: Đảm bảo `NODE_ENV=development` (log level = debug)
- Production: Chỉ thấy `info` trở lên, không thấy `debug`

### Logs quá nhiều

**Nguyên nhân:** LoggingInterceptor log mọi request  
**Giải pháp:** Có thể thêm `@SkipThrottle()` hoặc tạo custom interceptor để skip một số route (ví dụ health check)

### Không tìm được log của 1 request

**Giải pháp:** Dùng `x-correlation-id` từ response header để search:

```bash
docker compose logs app 2>&1 | grep "<correlation-id>"
```

### Exception không có stack trace

**Nguyên nhân:** Một số Error không có `.stack`  
**Giải pháp:** Log full exception:

```typescript
this.logger.error(
  {
    err: error,
    message: error?.message,
    stack: error?.stack,
  },
  'Error occurred',
);
```

### Logs không có màu (Docker)

**Nguyên nhân:** pino-pretty cần TTY  
**Giải pháp:** Bình thường khi chạy `docker compose up` (không -d) sẽ có màu. Với `-d`, logs không có màu.

### Muốn ghi log ra file

**Hiện tại:** Không có cấu hình ghi file  
**Giải pháp:** Có thể:

1. Pipe stdout khi chạy: `node dist/main.js >> app.log 2>&1`
2. Dùng PM2 với cấu hình file log
3. Thêm pino transport `pino/file` hoặc `pino-roll` (cần cấu hình thêm)

---

## 📁 Cấu trúc Files liên quan

| File                                                 | Mô tả                                |
| ---------------------------------------------------- | ------------------------------------ |
| `src/infrastructure/logger/logger.module.ts`         | Cấu hình Pino                        |
| `src/common/interceptors/logging.interceptor.ts`     | Log HTTP request/response            |
| `src/common/filters/all-exceptions.filter.ts`        | Bắt và log unhandled exceptions      |
| `src/common/filters/http-exception.filter.ts`        | Xử lý HttpException                  |
| `src/common/middleware/correlation-id.middleware.ts` | Gắn correlation ID                   |
| `src/common/utils/logger.util.ts`                    | InjectLogger helper                  |
| `src/main.ts`                                        | Đăng ký Logger, Interceptor, Filters |

---

## 📚 Tham khảo

- [NestJS Logging](https://docs.nestjs.com/techniques/logger)
- [Pino Documentation](https://getpino.io/)
- [nestjs-pino](https://github.com/iamolegga/nestjs-pino)
