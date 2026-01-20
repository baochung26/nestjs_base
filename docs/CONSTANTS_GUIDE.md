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

```typescript
import { USER_ROLES } from '../common/constants';

// Thay vì
role: 'user' | 'admin'

// Sử dụng
role: USER_ROLES.USER   // 'user'
role: USER_ROLES.ADMIN // 'admin'
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

// Auth
SUCCESS_MESSAGES.LOGIN_SUCCESS
SUCCESS_MESSAGES.REGISTER_SUCCESS

// User
SUCCESS_MESSAGES.USER_CREATED
SUCCESS_MESSAGES.USER_UPDATED
SUCCESS_MESSAGES.USER_DELETED
```

### Error Messages

```typescript
import { ERROR_MESSAGES } from '../common/constants';

// General
ERROR_MESSAGES.BAD_REQUEST
ERROR_MESSAGES.UNAUTHORIZED
ERROR_MESSAGES.NOT_FOUND
ERROR_MESSAGES.CONFLICT

// Auth
ERROR_MESSAGES.INVALID_CREDENTIALS
ERROR_MESSAGES.EMAIL_ALREADY_EXISTS
ERROR_MESSAGES.USER_NOT_FOUND

// User
ERROR_MESSAGES.USER_ALREADY_EXISTS
ERROR_MESSAGES.CANNOT_DELETE_SELF
```

### Validation Messages

```typescript
import { VALIDATION_MESSAGES } from '../common/constants';

// Dynamic messages
VALIDATION_MESSAGES.REQUIRED('email')           // "email is required"
VALIDATION_MESSAGES.MIN_LENGTH('password', 6)  // "password must be at least 6 characters"
VALIDATION_MESSAGES.MAX_LENGTH('name', 50)     // "name must not exceed 50 characters"
VALIDATION_MESSAGES.INVALID_TYPE('age', 'number') // "age must be a number"
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
PAGINATION.DEFAULT_PAGE  // 1
PAGINATION.DEFAULT_LIMIT  // 10
PAGINATION.MIN_PAGE       // 1
PAGINATION.MIN_LIMIT      // 1
PAGINATION.MAX_LIMIT      // 100
```

## 💻 Sử dụng trong Code

### Trong Custom Exceptions

```typescript
import { HTTP_STATUS, ERROR_MESSAGES } from '../common/constants';

export class NotFoundException extends HttpException {
  constructor(message: string = ERROR_MESSAGES.NOT_FOUND) {
    super(
      {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message,
        error: ERROR_MESSAGES.NOT_FOUND,
      },
      HTTP_STATUS.NOT_FOUND,
    );
  }
}
```

### Trong Services

```typescript
import { ERROR_MESSAGES } from '../common/constants';
import { ConflictException } from '../shared/errors/custom-exceptions';

async create(dto: CreateUserDto) {
  const existing = await this.userRepository.findOne({ email: dto.email });
  if (existing) {
    throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
  }
  // ...
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

```typescript
import { SUCCESS_MESSAGES, HTTP_STATUS } from '../common/constants';

static success<T>(
  data: T,
  message: string = SUCCESS_MESSAGES.SUCCESS,
  statusCode: number = HTTP_STATUS.OK,
) {
  return new ApiResponseDto(true, statusCode, message, data);
}
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
// ✅ Good - TypeScript sẽ check
const role: UserRole = USER_ROLES.USER; // ✅
const role: UserRole = 'invalid';       // ❌ Type error
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
  async findOne(id: string) {
    const user = await this.repository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.repository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }
    return this.repository.save(dto);
  }
}
```

### Controller với Constants

```typescript
import { Controller, Get, Post } from '@nestjs/common';
import { SUCCESS_MESSAGES, HTTP_STATUS } from '../common/constants';
import { ResponseHelper } from '../shared/response/response.helper';

@Controller('users')
export class UsersController {
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return ResponseHelper.success(user, SUCCESS_MESSAGES.RETRIEVED);
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return ResponseHelper.created(user, SUCCESS_MESSAGES.USER_CREATED);
  }
}
```

## 🔗 Tài liệu liên quan

- [API Response Format](./API_RESPONSE_FORMAT.md)
- [Error Handling](./API_RESPONSE_FORMAT.md#error-response-format)
