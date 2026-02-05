# Hướng dẫn Sử dụng Security Module

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Cài đặt](#cài-đặt)
- [CORS Configuration](#cors-configuration)
- [Helmet Security Headers](#helmet-security-headers)
- [Rate Limiting](#rate-limiting)
- [Custom Rate Limits](#custom-rate-limits)
- [Skip Rate Limiting](#skip-rate-limiting)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Tổng quan

Security Module cung cấp các tính năng bảo mật cho application:

- ✅ **CORS** - Cross-Origin Resource Sharing configuration
- ✅ **Helmet** - Security headers để bảo vệ khỏi các lỗ hổng phổ biến
- ✅ **Rate Limiting** - Giới hạn số lượng requests với @nestjs/throttler
- ✅ **Custom Rate Limits** - Tùy chỉnh rate limit cho từng endpoint
- ✅ **Skip Rate Limiting** - Bỏ qua rate limit cho public APIs

## 📦 Cài đặt

### Dependencies

Module đã được cài đặt với các dependencies sau:

```json
{
  "@nestjs/throttler": "^5.0.1",
  "helmet": "^7.1.0"
}
```

### Module Structure

```
src/infrastructure/security/
├── security.module.ts
└── security.config.ts

src/common/decorators/
└── skip-throttle.decorator.ts
```

## 🌐 CORS Configuration

### Default Configuration

CORS được cấu hình trong `security.config.ts`:

```typescript
{
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
  exposedHeaders: ['X-Correlation-ID'],
  maxAge: 86400, // 24 hours
}
```

### Environment Variables

Có thể cấu hình CORS origins qua environment variable:

```bash
# .env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://example.com
```

### Custom Origins

CORS sẽ tự động allow requests từ các origins được cấu hình. Requests từ origins không được phép sẽ bị reject.

## 🛡️ Helmet Security Headers

Helmet được cấu hình với các security headers sau:

### Headers được bật

- **Content-Security-Policy** - Ngăn chặn XSS attacks (disabled trong development)
- **Cross-Origin-Embedder-Policy** - Bảo vệ khỏi cross-origin attacks
- **Cross-Origin-Opener-Policy** - Bảo vệ khỏi cross-origin attacks
- **Cross-Origin-Resource-Policy** - Bảo vệ resources
- **DNS Prefetch Control** - Kiểm soát DNS prefetching
- **Frameguard** - Ngăn chặn clickjacking
- **Hide Powered-By** - Ẩn X-Powered-By header
- **HSTS** - HTTP Strict Transport Security
- **IE No Open** - Bảo vệ khỏi IE vulnerabilities
- **No Sniff** - Ngăn chặn MIME type sniffing
- **Origin Agent Cluster** - Bảo vệ origin
- **Referrer Policy** - Kiểm soát referrer information
- **XSS Filter** - Bảo vệ khỏi XSS attacks

### Development vs Production

Trong development mode, một số headers sẽ được disable để dễ dàng debug:

```typescript
const isDevelopment = configService.get('app.env') !== 'production';
```

## ⚡ Rate Limiting

### Default Rate Limits

Module cung cấp 3 rate limit presets:

1. **default** - 100 requests per minute
2. **short** - 10 requests per 10 seconds
3. **long** - 1000 requests per 10 minutes

### Configuration

Rate limiting được cấu hình trong `security.module.ts`:

```typescript
throttlers: [
  {
    name: 'default',
    ttl: 60000, // 1 minute
    limit: 100, // 100 requests per minute
  },
  {
    name: 'short',
    ttl: 10000, // 10 seconds
    limit: 10, // 10 requests per 10 seconds
  },
  {
    name: 'long',
    ttl: 600000, // 10 minutes
    limit: 1000, // 1000 requests per 10 minutes
  },
];
```

### Global Rate Limiting

Tất cả endpoints sẽ bị rate limit theo preset `default` (100 requests/minute) trừ khi được cấu hình khác.

## 🎛️ Custom Rate Limits

### Sử dụng Preset

Sử dụng decorator `@ThrottlePreset()` để áp dụng preset:

```typescript
import { ThrottlePreset } from '../common/decorators/skip-throttle.decorator';

@Controller('auth')
export class AuthController {
  @Post('login')
  @ThrottlePreset('short') // 10 requests per 10 seconds
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
```

### Custom Rate Limit

Sử dụng decorator `@ThrottleCustom()` để tạo custom rate limit:

```typescript
import { ThrottleCustom } from '../common/decorators/skip-throttle.decorator';

@Controller('api')
export class ApiController {
  @Get('data')
  @ThrottleCustom(50, 30000) // 50 requests per 30 seconds
  getData() {
    return { data: '...' };
  }
}
```

## 🚫 Skip Rate Limiting

### Skip cho toàn bộ Controller

Sử dụng decorator `@SkipThrottle()` ở controller level:

```typescript
import { SkipThrottle } from '../common/decorators/skip-throttle.decorator';

@Controller('health')
@SkipThrottle() // Skip rate limiting for all endpoints
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
```

### Skip cho một Endpoint

Sử dụng decorator `@SkipThrottle()` ở method level:

```typescript
import { SkipThrottle } from '../common/decorators/skip-throttle.decorator';

@Controller('public')
export class PublicController {
  @Get('info')
  @SkipThrottle() // Skip rate limiting for this endpoint
  getPublicInfo() {
    return { info: '...' };
  }

  @Get('data')
  // This endpoint will use default rate limit
  getData() {
    return { data: '...' };
  }
}
```

## 📖 Ví dụ Sử dụng

### Auth Controller với Rate Limiting

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ThrottlePreset } from '../common/decorators/skip-throttle.decorator';

@Controller('auth')
export class AuthController {
  @Post('register')
  @ThrottlePreset('short') // 10 requests per 10 seconds
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ThrottlePreset('short') // 10 requests per 10 seconds
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @ThrottlePreset('short') // 10 requests per 10 seconds
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }
}
```

### Public API Controller

```typescript
import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '../common/decorators/skip-throttle.decorator';

@Controller('public')
@SkipThrottle() // Skip rate limiting for all public endpoints
export class PublicController {
  @Get('info')
  getInfo() {
    return { info: 'Public information' };
  }

  @Get('status')
  getStatus() {
    return { status: 'ok' };
  }
}
```

### Mixed Rate Limiting

```typescript
import { Controller, Get, Post } from '@nestjs/common';
import {
  ThrottlePreset,
  ThrottleCustom,
  SkipThrottle,
} from '../common/decorators/skip-throttle.decorator';

@Controller('api')
export class ApiController {
  @Get('public')
  @SkipThrottle() // No rate limit
  getPublic() {
    return { data: 'public' };
  }

  @Get('data')
  @ThrottlePreset('default') // 100 requests per minute
  getData() {
    return { data: '...' };
  }

  @Post('upload')
  @ThrottleCustom(5, 60000) // 5 requests per minute
  upload(@Body() file: any) {
    return { success: true };
  }
}
```

## 🔒 Best Practices

### 1. Rate Limit cho Auth Endpoints

Luôn áp dụng rate limit nghiêm ngặt cho auth endpoints:

```typescript
@Post('login')
@ThrottlePreset('short') // 10 requests per 10 seconds
login() {}
```

### 2. Skip Rate Limit cho Health Checks

Health check endpoints nên skip rate limiting:

```typescript
@Controller('health')
@SkipThrottle()
export class HealthController {}
```

### 3. Custom Rate Limit cho Heavy Operations

Áp dụng rate limit nghiêm ngặt cho các operations tốn tài nguyên:

```typescript
@Post('generate-report')
@ThrottleCustom(3, 60000) // 3 requests per minute
generateReport() {}
```

### 4. CORS Configuration

Chỉ allow các origins cần thiết:

```bash
CORS_ORIGINS=https://app.example.com,https://admin.example.com
```

### 5. Helmet trong Production

Đảm bảo Helmet được enable trong production:

```typescript
const isDevelopment = configService.get('app.env') !== 'production';
```

## 🐛 Troubleshooting

### Rate Limit Error

**Error:** `Too Many Requests`

**Nguyên nhân:** Vượt quá rate limit

**Giải pháp:**

1. Kiểm tra rate limit configuration
2. Sử dụng `@SkipThrottle()` nếu cần
3. Tăng rate limit nếu hợp lý

### CORS Error

**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Nguyên nhân:** Origin không được phép

**Giải pháp:**

1. Thêm origin vào `CORS_ORIGINS` trong `.env`
2. Kiểm tra CORS configuration trong `security.config.ts`

### Helmet Blocking Resources

**Nguyên nhân:** Content-Security-Policy quá strict

**Giải pháp:**

1. Điều chỉnh CSP directives trong `security.config.ts`
2. Disable CSP trong development mode

### Rate Limit không hoạt động

**Nguyên nhân:** ThrottlerGuard không được register

**Giải pháp:**

1. Kiểm tra `SecurityModule` đã được import vào `AppModule`
2. Kiểm tra `APP_GUARD` provider trong `SecurityModule`

## 📊 Rate Limit Headers

Khi rate limit được áp dụng, response sẽ include các headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🔗 Tài liệu liên quan

- [NestJS Throttler Documentation](https://docs.nestjs.com/security/rate-limiting)
- [Helmet Documentation](https://helmetjs.github.io/)
- [CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
