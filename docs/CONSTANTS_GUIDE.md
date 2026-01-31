# Hướng dẫn Sử dụng Constants

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Cấu trúc Constants](#cấu-trúc-constants)
- [HTTP Status Constants](#http-status-constants)
- [User Constants](#user-constants)
- [Message Constants](#message-constants)
- [Pagination Constants](#pagination-constants)
- [Sử dụng trong Code](#sử-dụng-trong-code)
- [Best Practices](#best-practices)

## 🎯 Tổng quan

Constants được tổ chức trong `src/common/constants/` để đảm bảo:

- ✅ **Tính nhất quán** - Tất cả giá trị được định nghĩa ở một nơi
- ✅ **Dễ bảo trì** - Thay đổi một lần, áp dụng toàn bộ
- ✅ **Type Safety** - TypeScript type checking
- ✅ **Tái sử dụng** - Import và sử dụng ở bất kỳ đâu

## 📁 Cấu trúc Constants

```
src/common/constants/
├── index.ts                    # Export tất cả constants
├── http-status.constants.ts    # HTTP status codes
├── user.constants.ts           # User-related constants
├── message.constants.ts        # Success & Error messages
└── pagination.constants.ts     # Pagination constants
```

## 🔢 HTTP Status Constants

### Sử dụng

```typescript
import { HTTP_STATUS } from '../common/constants';

// Thay vì
return new ApiResponseDto(true, 200, 'Success', data);

// Sử dụng
return new ApiResponseDto(true, HTTP_STATUS.OK, 'Success', data);
```

### Available Constants

```typescript
HTTP_STATUS.OK                    // 200
HTTP_STATUS.CREATED               // 201
HTTP_STATUS.BAD_REQUEST           // 400
HTTP_STATUS.UNAUTHORIZED          // 401
HTTP_STATUS.FORBIDDEN             // 403
HTTP_STATUS.NOT_FOUND             // 404
HTTP_STATUS.CONFLICT              // 409
HTTP_STATUS.UNPROCESSABLE_ENTITY  // 422
HTTP_STATUS.INTERNAL_SERVER_ERROR // 500
// ... và nhiều hơn
```

## 👤 User Constants

### User Roles

**Lưu ý:** Project sử dụng `UserRole` enum từ `user.entity.ts` cho type và decorator. Dùng `USER_ROLES` từ constants khi cần so sánh chuỗi.

```typescript
// Trong entity/DTO - dùng UserRole enum
import { UserRole } from '../users/entities/user.entity';
role: UserRole.USER   // 'user'
role: UserRole.ADMIN  // 'admin'

// Khi cần so sánh string - dùng USER_ROLES từ constants
import { USER_ROLES } from '../common/constants';
if (role === USER_ROLES.ADMIN) { ... }
```

### User Status

```typescript
import { USER_STATUS } from '../common/constants';

isActive: USER_STATUS.ACTIVE   // true
isActive: USER_STATUS.INACTIVE // false
```

### User Defaults

```typescript
import { USER_DEFAULTS } from '../common/constants';

// Default role
role: USER_DEFAULTS.ROLE // 'user'

// Default active status
isActive: USER_DEFAULTS.IS_ACTIVE // true

// Minimum password length
@MinLength(USER_DEFAULTS.MIN_PASSWORD_LENGTH) // 6
```

## 💬 Message Constants

### Success Messages

```typescript
import { SUCCESS_MESSAGES } from '../common/constants';

// General
SUCCESS_MESSAGES.SUCCESS
SUCCESS_MESSAGES.CREATED
SUCCESS_MESSAGES.UPDATED
SUCCESS_MESSAGES.DELETED
SUCCESS_MESSAGES.RETRIEVED

// Auth
SUCCESS_MESSAGES.LOGIN_SUCCESS
SUCCESS_MESSAGES.REGISTER_SUCCESS
SUCCESS_MESSAGES.LOGOUT_SUCCESS
SUCCESS_MESSAGES.PASSWORD_RESET_SENT
SUCCESS_MESSAGES.EMAIL_VERIFIED

// User
SUCCESS_MESSAGES.USER_CREATED
SUCCESS_MESSAGES.USER_UPDATED
SUCCESS_MESSAGES.USER_DELETED
SUCCESS_MESSAGES.USER_ACTIVATED
SUCCESS_MESSAGES.USER_DEACTIVATED

// File, Queue, Cache
SUCCESS_MESSAGES.FILE_UPLOADED
SUCCESS_MESSAGES.JOB_ADDED
SUCCESS_MESSAGES.CACHE_CLEARED
```

### Error Messages

```typescript
import { ERROR_MESSAGES } from '../common/constants';

// General
ERROR_MESSAGES.BAD_REQUEST
ERROR_MESSAGES.UNAUTHORIZED
ERROR_MESSAGES.FORBIDDEN
ERROR_MESSAGES.NOT_FOUND
ERROR_MESSAGES.CONFLICT
ERROR_MESSAGES.VALIDATION_ERROR
ERROR_MESSAGES.TOO_MANY_REQUESTS
ERROR_MESSAGES.INTERNAL_SERVER_ERROR

// Auth
ERROR_MESSAGES.INVALID_CREDENTIALS
ERROR_MESSAGES.EMAIL_ALREADY_EXISTS
ERROR_MESSAGES.INVALID_TOKEN
ERROR_MESSAGES.INVALID_REFRESH_TOKEN
ERROR_MESSAGES.TOKEN_EXPIRED
ERROR_MESSAGES.ACCOUNT_INACTIVE

// User
ERROR_MESSAGES.USER_NOT_FOUND
ERROR_MESSAGES.USER_ALREADY_EXISTS
ERROR_MESSAGES.CANNOT_DELETE_SELF
ERROR_MESSAGES.CANNOT_DEACTIVATE_SELF

// File, Database, Queue, Cache
ERROR_MESSAGES.FILE_NOT_FOUND
ERROR_MESSAGES.DATABASE_ERROR
ERROR_MESSAGES.CACHE_ERROR
```

### Validation Messages

```typescript
import { VALIDATION_MESSAGES } from '../common/constants';

// Dynamic messages (hàm nhận tham số)
VALIDATION_MESSAGES.REQUIRED('email')              // "email is required"
VALIDATION_MESSAGES.MIN_LENGTH('password', 6)      // "password must be at least 6 characters"
VALIDATION_MESSAGES.MAX_LENGTH('name', 50)         // "name must not exceed 50 characters"
VALIDATION_MESSAGES.INVALID_TYPE('age', 'number')  // "age must be a number"
VALIDATION_MESSAGES.INVALID_ENUM('role', ['user', 'admin'])  // "role must be one of: user, admin"
VALIDATION_MESSAGES.INVALID_FORMAT('email')        // "Invalid email format"

// Static message
VALIDATION_MESSAGES.INVALID_EMAIL  // "Invalid email format"
```

## 📄 Pagination Constants

### Sử dụng

```typescript
import { PAGINATION } from '../common/constants';

// Default values
page: PAGINATION.DEFAULT_PAGE   // 1
limit: PAGINATION.DEFAULT_LIMIT  // 10

// Min/Max values
@Min(PAGINATION.MIN_PAGE)       // 1
@Min(PAGINATION.MIN_LIMIT)      // 1
@Max(PAGINATION.MAX_LIMIT)      // 100
```

### Available Constants

```typescript
PAGINATION.DEFAULT_PAGE   // 1
PAGINATION.DEFAULT_LIMIT  // 10
PAGINATION.MIN_PAGE       // 1
PAGINATION.MIN_LIMIT      // 1
PAGINATION.MAX_LIMIT      // 100
```

### Pagination Messages

```typescript
import { PAGINATION_MESSAGES } from '../common/constants';

PAGINATION_MESSAGES.INVALID_PAGE   // "Page must be at least 1"
PAGINATION_MESSAGES.INVALID_LIMIT  // "Limit must be between 1 and 100"
```

## 💻 Sử dụng trong Code

### Trong Custom Exceptions

Project có sẵn custom exceptions trong `src/shared/errors/custom-exceptions.ts`:

```typescript
import { NotFoundException, ConflictException } from '../shared/errors/custom-exceptions';
import { ERROR_MESSAGES } from '../common/constants';

// Sử dụng với message mặc định
throw new NotFoundException();

// Hoặc với message tùy chỉnh
throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
```

**Các exception có sẵn:** BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException, ConflictException, InternalServerErrorException, ValidationException

### Trong Services

```typescript
import { ERROR_MESSAGES } from '../common/constants';
import { ConflictException, NotFoundException } from '../shared/errors/custom-exceptions';

async create(dto: CreateUserDto) {
  const existing = await this.usersRepository.findByEmail(dto.email);
  if (existing) {
    throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
  }
  // ...
}

async findOne(id: string) {
  const user = await this.usersRepository.findById(id);
  if (!user) {
    throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
  }
  return user;
}
```

### Trong DTOs

```typescript
import { USER_DEFAULTS } from '../common/constants';

export class CreateUserDto {
  @IsString()
  @MinLength(USER_DEFAULTS.MIN_PASSWORD_LENGTH)
  password: string;
}
```

### Trong Response Helpers

Project có sẵn `ResponseHelper` trong `src/shared/response/response.helper.ts`:

```typescript
import { ResponseHelper } from '../shared/response/response.helper';
import { SUCCESS_MESSAGES } from '../common/constants';

// Success response
ResponseHelper.success(user, SUCCESS_MESSAGES.SUCCESS);

// Created response (201)
ResponseHelper.created(user, SUCCESS_MESSAGES.USER_CREATED);

// Paginated response
ResponseHelper.paginated(users, page, limit, total, SUCCESS_MESSAGES.RETRIEVED);
```

### Trong Filters

```typescript
import { HTTP_STATUS, ERROR_MESSAGES } from '../common/constants';

let status = HTTP_STATUS.INTERNAL_SERVER_ERROR;
let message = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
```

## ✅ Best Practices

### 1. Luôn sử dụng Constants

```typescript
// ❌ Bad
throw new NotFoundException('User not found');
return new ApiResponseDto(true, 200, 'Success', data);

// ✅ Good
throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
return new ApiResponseDto(true, HTTP_STATUS.OK, SUCCESS_MESSAGES.SUCCESS, data);
```

### 2. Import từ index

```typescript
// ❌ Bad
import { HTTP_STATUS } from '../common/constants/http-status.constants';
import { ERROR_MESSAGES } from '../common/constants/message.constants';

// ✅ Good
import { HTTP_STATUS, ERROR_MESSAGES } from '../common/constants';
```

### 3. Sử dụng Type Safety

```typescript
// ✅ Good - Dùng UserRole enum từ entity
import { UserRole } from '../users/entities/user.entity';
const role: UserRole = UserRole.USER;  // ✅
const role: UserRole = 'invalid';      // ❌ Type error
```

### 4. Không hardcode values

```typescript
// ❌ Bad
if (page < 1) throw new Error('Invalid page');
@MinLength(6) password: string;

// ✅ Good
if (page < PAGINATION.MIN_PAGE) throw new Error(PAGINATION_MESSAGES.INVALID_PAGE);
@MinLength(USER_DEFAULTS.MIN_PASSWORD_LENGTH) password: string;
```

### 5. Sử dụng Dynamic Messages khi cần

```typescript
// ✅ Good - Dynamic validation messages
VALIDATION_MESSAGES.REQUIRED('email')
VALIDATION_MESSAGES.MIN_LENGTH('password', 6)
```

## 📖 Ví dụ Hoàn chỉnh

### Service với Constants

```typescript
import { Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '../common/constants';
import { NotFoundException, ConflictException } from '../shared/errors/custom-exceptions';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findOne(id: string) {
    const user = await this.usersRepository.findByIdWithoutPassword(id);
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    return user;
  }

  async create(dto: CreateUserDto) {
    const emailExists = await this.usersRepository.emailExists(dto.email);
    if (emailExists) {
      throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }
    // ... hash password, save
  }
}
```

### Controller với Constants

**Lưu ý:** Project sử dụng `TransformInterceptor` để tự động wrap response. Controller trả về data trực tiếp, interceptor thêm success, statusCode, message.

```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SUCCESS_MESSAGES } from '../common/constants';
import { ResponseHelper } from '../shared/response/response.helper';

@Controller('users')
export class UsersController {
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return user;  // TransformInterceptor wrap response
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return user;  // TransformInterceptor wrap với status 201
  }
}
```

Khi cần response tùy chỉnh (message, statusCode), có thể dùng ResponseHelper:
```typescript
return ResponseHelper.created(user, SUCCESS_MESSAGES.USER_CREATED);
```

## 🔗 Tài liệu liên quan

- [API Response Format](./API_RESPONSE_FORMAT.md) - Chuẩn hóa API response
- [API Response Format - Error](./API_RESPONSE_FORMAT.md#error-response-format) - Error response format
