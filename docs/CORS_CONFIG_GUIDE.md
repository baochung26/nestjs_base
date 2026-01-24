# Hướng dẫn Cấu hình CORS

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Cấu hình trong .env](#cấu-hình-trong-env)
- [Cấu hình trong Code](#cấu-hình-trong-code)
- [Cách hoạt động](#cách-hoạt-động)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Tổng quan

CORS (Cross-Origin Resource Sharing) được cấu hình tập trung trong:
- **File config:** `src/config/configuration.ts` - `corsConfig`
- **File security:** `src/infrastructure/security/security.config.ts` - `getCorsConfig()`
- **Environment variable:** `CORS_ORIGINS` trong `.env`

## ⚙️ Cấu hình trong .env

### Cách 1: Sử dụng Environment Variable (Khuyến nghị)

Thêm vào file `.env`:

```env
# CORS Configuration
# Comma-separated list of allowed origins
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,https://yourdomain.com
```

**Format:**
- Các origins cách nhau bởi dấu phẩy (`,`)
- Không có khoảng trắng (hoặc sẽ được tự động trim)
- Hỗ trợ cả HTTP và HTTPS
- Hỗ trợ custom ports

**Ví dụ:**
```env
# Development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Production
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com

# Multiple environments
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://staging.yourdomain.com,https://yourdomain.com
```

### Default Values

Nếu không set `CORS_ORIGINS` trong `.env`, hệ thống sẽ sử dụng default:

```typescript
[
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
]
```

## 💻 Cấu hình trong Code

### File: `src/config/configuration.ts`

```typescript
export const corsConfig = registerAs('cors', () => {
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ];

  const origins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
    : defaultOrigins;

  return {
    origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    exposedHeaders: ['X-Correlation-ID'],
    maxAge: 86400, // 24 hours
  };
});
```

### File: `src/infrastructure/security/security.config.ts`

```typescript
export const getCorsConfig = (configService: ConfigService) => {
  const corsConfig = configService.get('cors');
  const allowedOrigins = corsConfig?.origins || [];

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS. Origin: ${origin} is not in allowed list: ${allowedOrigins.join(', ')}`));
      }
    },
    credentials: corsConfig?.credentials ?? true,
    methods: corsConfig?.methods || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: corsConfig?.allowedHeaders || ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    exposedHeaders: corsConfig?.exposedHeaders || ['X-Correlation-ID'],
    maxAge: corsConfig?.maxAge || 86400,
  };
};
```

## 🔄 Cách hoạt động

1. **Load Config:** `ConfigModule` load `corsConfig` từ `configuration.ts`
2. **Read .env:** Đọc `CORS_ORIGINS` từ environment variables
3. **Parse Origins:** Split và trim các origins
4. **Apply Config:** Áp dụng vào `getCorsConfig()` trong `main.ts`
5. **Validate:** Mỗi request được kiểm tra origin

### Flow Diagram

```
.env (CORS_ORIGINS)
    ↓
configuration.ts (corsConfig)
    ↓
ConfigModule (load config)
    ↓
security.config.ts (getCorsConfig)
    ↓
main.ts (app.enableCors)
    ↓
Request → Check Origin → Allow/Deny
```

## ✅ Best Practices

### 1. Development vs Production

```env
# Development - Cho phép nhiều origins
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3000

# Production - Chỉ cho phép domains thật
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 2. Không dùng Wildcard trong Production

```env
# ❌ Bad - Không an toàn
CORS_ORIGINS=*

# ✅ Good - Chỉ định rõ ràng
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 3. Sử dụng HTTPS trong Production

```env
# ❌ Bad - HTTP trong production
CORS_ORIGINS=http://yourdomain.com

# ✅ Good - HTTPS trong production
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 4. Tách riêng cho từng Environment

```env
# .env.development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# .env.staging
CORS_ORIGINS=https://staging.yourdomain.com

# .env.production
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 5. Credentials

CORS config đã enable `credentials: true` để hỗ trợ:
- Cookies
- Authorization headers
- Custom headers

## 🐛 Troubleshooting

### Lỗi: "Not allowed by CORS"

**Nguyên nhân:** Origin của frontend không có trong danh sách allowed origins.

**Giải pháp:**

1. **Kiểm tra origin của frontend:**
   ```javascript
   // Trong browser console
   console.log(window.location.origin);
   // Output: http://localhost:3002
   ```

2. **Thêm vào .env:**
   ```env
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
   ```

3. **Restart application:**
   ```bash
   docker compose restart app
   ```

### Lỗi: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Nguyên nhân:** CORS chưa được cấu hình hoặc config sai.

**Giải pháp:**

1. **Kiểm tra config đã load:**
   ```bash
   docker compose exec app sh
   # Trong container
   echo $CORS_ORIGINS
   ```

2. **Kiểm tra logs:**
   ```bash
   docker compose logs app | grep -i cors
   ```

3. **Verify trong code:**
   - Đảm bảo `corsConfig` được import trong `app.module.ts`
   - Đảm bảo `getCorsConfig()` được gọi trong `main.ts`

### Lỗi: "Credentials flag is true, but Access-Control-Allow-Credentials is not set"

**Nguyên nhân:** Frontend gửi `credentials: 'include'` nhưng backend chưa config đúng.

**Giải pháp:**

Config đã có `credentials: true` mặc định. Nếu vẫn lỗi, kiểm tra:

1. **Frontend fetch:**
   ```typescript
   fetch('http://localhost:3000/api/v1/auth/login', {
     method: 'POST',
     credentials: 'include', // ✅ Đúng
     headers: {
       'Content-Type': 'application/json',
     },
     body: JSON.stringify(data),
   });
   ```

2. **Backend config:** Đã có `credentials: true` trong `corsConfig`

### Origin không được allow sau khi thêm vào .env

**Nguyên nhân:** Application chưa restart hoặc có khoảng trắng trong config.

**Giải pháp:**

1. **Kiểm tra format trong .env:**
   ```env
   # ✅ Good - Không có khoảng trắng thừa
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002
   
   # ❌ Bad - Có khoảng trắng
   CORS_ORIGINS=http://localhost:3000, http://localhost:3001
   ```

2. **Restart application:**
   ```bash
   docker compose restart app
   ```

3. **Code tự động trim:** Code đã có `.trim()` nên khoảng trắng sẽ được xử lý tự động

## 📝 Ví dụ Hoàn chỉnh

### .env file

```env
# Development
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Production
NODE_ENV=production
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com
```

### Frontend (Next.js)

```typescript
// lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient = {
  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Quan trọng nếu dùng cookies
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
```

### Test với cURL

```bash
# Test CORS với origin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Origin: http://localhost:3002" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"user123"}' \
  -v
```

## 🔗 Tài liệu liên quan

- [NestJS CORS Documentation](https://docs.nestjs.com/security/cors)
- [MDN CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Environment Variables Guide](./ENV_VALIDATION_GUIDE.md)
