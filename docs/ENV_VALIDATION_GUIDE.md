# Hướng dẫn Environment Variables Validation

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Validation Schema](#validation-schema)
- [Required Variables](#required-variables)
- [Optional Variables](#optional-variables)
- [Validation Errors](#validation-errors)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Tổng quan

Dự án sử dụng **Joi** để validate environment variables khi application khởi động. Điều này đảm bảo:

- ✅ Tất cả required variables đều có giá trị
- ✅ Các giá trị đúng format và type
- ✅ Default values được áp dụng cho optional variables
- ✅ Application không start nếu có validation errors

## 📝 Validation Schema

Validation schema được định nghĩa trong `src/config/validation.schema.ts`:

```typescript
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test'),
  APP_PORT: Joi.number().port().default(3000),
  DB_HOST: Joi.string().required(),
  // ... more validations
});
```

## 🔴 Required Variables

Các environment variables **BẮT BUỘC** phải có trong `.env`:

### Database

- `DB_HOST` - Database host
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name

### JWT

- `JWT_SECRET` - JWT secret key (minimum 32 characters)

### Example `.env` với required variables:

```env
# Database (Required)
DB_HOST=postgres
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=nestjs_db

# JWT (Required)
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
```

## 🟢 Optional Variables

Các environment variables có **default values**:

### App Configuration

```env
NODE_ENV=development          # Default: development
APP_PORT=3000                 # Default: 3000
```

### Database

```env
DB_PORT=5432                  # Default: 5432
DB_SSL=false                  # Default: false
```

### Redis

```env
REDIS_HOST=localhost          # Default: localhost
REDIS_PORT=6379               # Default: 6379
REDIS_PASSWORD=               # Default: '' (empty)
REDIS_DB=0                    # Default: 0
```

### JWT

```env
JWT_EXPIRES_IN=7d             # Default: 7d
```

### Google OAuth (Optional)

```env
GOOGLE_CLIENT_ID=            # Default: '' (empty)
GOOGLE_CLIENT_SECRET=         # Default: '' (empty)
GOOGLE_CALLBACK_URL=          # Default: '' (empty)
FRONTEND_URL=http://localhost:3001  # Default: http://localhost:3001
```

### Mail (Optional)

```env
MAIL_HOST=smtp.gmail.com     # Default: smtp.gmail.com
MAIL_PORT=587                # Default: 587
MAIL_SECURE=false            # Default: false
MAIL_USER=                   # Default: '' (empty)
MAIL_PASSWORD=               # Default: '' (empty)
MAIL_FROM=                   # Default: '' (empty)
MAIL_FROM_NAME=NestJS App    # Default: NestJS App
```

### Storage (Optional)

```env
STORAGE_TYPE=local           # Default: local
STORAGE_LOCAL_DESTINATION=./uploads  # Default: ./uploads
STORAGE_MAX_FILE_SIZE=10485760       # Default: 10485760 (10MB)
STORAGE_ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,application/pdf,text/plain
```

### CORS (Optional)

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## ❌ Validation Errors

### Khi Application Start

Nếu có validation errors, application sẽ **KHÔNG START** và hiển thị lỗi:

```
Error: Config validation error: "DB_HOST" is required
```

### Common Validation Errors

#### 1. Missing Required Variable

```
Error: Config validation error: "JWT_SECRET" is required
```

**Giải pháp:** Thêm `JWT_SECRET` vào `.env` file.

#### 2. Invalid Type

```
Error: Config validation error: "APP_PORT" must be a number
```

**Giải pháp:** Đảm bảo `APP_PORT` là số, không phải string.

#### 3. Invalid Value

```
Error: Config validation error: "NODE_ENV" must be one of [development, production, test]
```

**Giải pháp:** Sửa `NODE_ENV` thành một trong các giá trị hợp lệ.

#### 4. Invalid Format

```
Error: Config validation error: "MAIL_USER" must be a valid email
```

**Giải pháp:** Đảm bảo `MAIL_USER` là email hợp lệ.

#### 5. Value Too Short

```
Error: Config validation error: "JWT_SECRET" length must be at least 32 characters long
```

**Giải pháp:** Tăng độ dài `JWT_SECRET` lên ít nhất 32 ký tự.

## ✅ Best Practices

### 1. Luôn Validate Required Variables

```env
# ✅ Good - Tất cả required variables đều có
DB_HOST=postgres
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=nestjs_db
JWT_SECRET=your-super-secret-key-minimum-32-characters-long

# ❌ Bad - Thiếu required variables
DB_HOST=postgres
# Missing DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET
```

### 2. Sử dụng Strong JWT Secret

```env
# ✅ Good - JWT secret đủ dài và phức tạp
JWT_SECRET=your-super-secret-key-minimum-32-characters-long-random-string

# ❌ Bad - JWT secret quá ngắn
JWT_SECRET=secret
```

### 3. Environment-specific Values

```env
# Development
NODE_ENV=development
DB_SSL=false

# Production
NODE_ENV=production
DB_SSL=true
```

### 4. Không Commit Sensitive Data

```env
# ✅ Good - Sử dụng .env.example
# .env.example (committed)
JWT_SECRET=your-secret-key-here
DB_PASSWORD=your-password-here

# .env (not committed)
JWT_SECRET=actual-secret-key
DB_PASSWORD=actual-password
```

### 5. Validate trước khi Deploy

```bash
# Test validation
npm run start:dev

# Nếu có lỗi, fix trước khi deploy
```

## 🐛 Troubleshooting

### Application không start với validation error

**Nguyên nhân:** Missing required variable hoặc invalid value.

**Giải pháp:**

1. Kiểm tra error message
2. Thêm/sửa variable trong `.env`
3. Restart application

### Validation pass nhưng application vẫn lỗi

**Nguyên nhân:** Có thể có logic error trong code.

**Giải pháp:**

1. Kiểm tra logs
2. Verify values trong `.env` đúng với expected format
3. Check application code

### Default values không được áp dụng

**Nguyên nhân:** Có thể có giá trị empty string trong `.env`.

**Giải pháp:**

1. Xóa variable khỏi `.env` để sử dụng default
2. Hoặc set giá trị cụ thể

### Validation không chạy

**Nguyên nhân:** `ConfigModule` chưa được cấu hình với validation.

**Giải pháp:**

1. Kiểm tra `app.module.ts` có import `validationSchema` và `validationOptions`
2. Đảm bảo `joi` đã được cài đặt

## 📖 Ví dụ Hoàn chỉnh

### `.env` file mẫu

```env
# App Configuration
NODE_ENV=development
APP_PORT=3000

# Database (Required)
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=nestjs_db
DB_SSL=false

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT (Required)
JWT_SECRET=your-super-secret-key-minimum-32-characters-long-random-string
JWT_EXPIRES_IN=7d

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
FRONTEND_URL=http://localhost:3001

# Mail (Optional)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM=
MAIL_FROM_NAME=NestJS App

# Storage (Optional)
STORAGE_TYPE=local
STORAGE_LOCAL_DESTINATION=./uploads
STORAGE_MAX_FILE_SIZE=10485760
STORAGE_ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,application/pdf,text/plain

# CORS (Optional)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# pgAdmin (Optional)
PGADMIN_EMAIL=admin@example.com
PGADMIN_PASSWORD=admin
PGADMIN_PORT=5050
```

## 🔗 Tài liệu liên quan

- [Joi Documentation](https://joi.dev/api/)
- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
- [Environment Variables Best Practices](./ARCHITECTURE_IMPROVEMENTS.md)
