# API Response Format Documentation

## Tổng quan

Tất cả API responses trong dự án đều tuân theo format chuẩn để đảm bảo tính nhất quán và dễ dàng xử lý ở frontend.

## Success Response Format

### Standard Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    // Your data here
  },
  "timestamp": "2024-01-19T10:30:00.000Z",
  "path": "/api/users/123"
}
```

### Created Response (201)

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Created successfully",
  "data": {
    // Created resource
  },
  "timestamp": "2024-01-19T10:30:00.000Z",
  "path": "/api/users"
}
```

### Paginated Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    // Array of items
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "timestamp": "2024-01-19T10:30:00.000Z",
  "path": "/api/users"
}
```

## Error Response Format

### Standard Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Validation failed",
  "timestamp": "2024-01-19T10:30:00.000Z",
  "path": "/api/users"
}
```

### Validation Error Response (422)

```json
{
  "success": false,
  "statusCode": 422,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Validation Error",
  "timestamp": "2024-01-19T10:30:00.000Z",
  "path": "/api/auth/register"
}
```

### Not Found Error (404)

```json
{
  "success": false,
  "statusCode": 404,
  "message": "User with ID 123 not found",
  "error": "Not Found",
  "timestamp": "2024-01-19T10:30:00.000Z",
  "path": "/api/users/123"
}
```

### Unauthorized Error (401)

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "timestamp": "2024-01-19T10:30:00.000Z",
  "path": "/api/auth/login"
}
```

### Forbidden Error (403)

```json
{
  "success": false,
  "statusCode": 403,
  "message": "You do not have permission to access this resource",
  "error": "Forbidden",
  "timestamp": "2024-01-19T10:30:00.000Z",
  "path": "/api/admin/users"
}
```

### Conflict Error (409)

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict",
  "timestamp": "2024-01-19T10:30:00.000Z",
  "path": "/api/auth/register"
}
```

### Internal Server Error (500)

```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error",
  "timestamp": "2024-01-19T10:30:00.000Z",
  "path": "/api/users"
}
```

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Success response |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Validation errors |
| 500 | Internal Server Error | Server error |

## Sử dụng trong Code

### Trong Controllers

Controllers không cần trả về format chuẩn, TransformInterceptor sẽ tự động format:

```typescript
@Get(':id')
async findOne(@Param('id') id: string) {
  // Chỉ cần return data, interceptor sẽ format
  return this.userService.findOne(id);
}

// Hoặc với message tùy chỉnh
@Post()
async create(@Body() dto: CreateUserDto) {
  const user = await this.userService.create(dto);
  return {
    message: 'User created successfully',
    ...user,
  };
}
```

### Sử dụng ResponseHelper (Optional)

Nếu muốn kiểm soát response format rõ ràng hơn:

> **Note:** `ResponseHelper` không conflict với `TransformInterceptor`. Interceptor tự động detect nếu response đã là `ApiResponseDto` instance và sẽ return nguyên vẹn, không wrap lại.

```typescript
import { ResponseHelper } from '../../shared/response/response.helper';

@Get(':id')
async findOne(@Param('id') id: string) {
  const user = await this.userService.findOne(id);
  return ResponseHelper.success(user, 'User retrieved successfully');
}

@Post()
async create(@Body() dto: CreateUserDto) {
  const user = await this.userService.create(dto);
  return ResponseHelper.created(user, 'User created successfully');
}

@Delete(':id')
async remove(@Param('id') id: string) {
  await this.userService.remove(id);
  return ResponseHelper.deleted('User deleted successfully');
}
```

### Sử dụng Custom Exceptions

```typescript
import { NotFoundException, ConflictException } from '../../shared/errors/custom-exceptions';

// Trong service
async findOne(id: string) {
  const user = await this.userRepository.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundException(`User with ID ${id} not found`);
  }
  return user;
}

async create(dto: CreateUserDto) {
  const existing = await this.userRepository.findOne({ where: { email: dto.email } });
  if (existing) {
    throw new ConflictException('Email already exists');
  }
  // ...
}
```

### Custom Exceptions và Exception Filters (không conflict)

**Custom exceptions** (`src/shared/errors/custom-exceptions.ts`) đều kế thừa `HttpException` và truyền object `{ statusCode, message, error }` vào `super()`. Khi filter gọi `exception.getResponse()` sẽ nhận đúng object này.

| Thành phần | Vai trò |
|------------|--------|
| **HttpExceptionFilter** (`src/common/filters/http-exception.filter.ts`) | `@Catch(HttpException)` — bắt mọi exception kế thừa `HttpException` (gồm tất cả custom exceptions). Đọc `getStatus()`, `getResponse()` rồi tạo `ApiErrorResponseDto` và trả về JSON. |
| **AllExceptionsFilter** (`src/common/filters/all-exceptions.filter.ts`) | `@Catch()` — bắt mọi exception còn lại (lỗi không phải HttpException). Với `HttpException` thì xử lý giống (status, message, error); với `Error` khác dùng message và 500. |

**Kết luận:** Custom exceptions **không conflict** với hai filter. Trong `main.ts` đăng ký:

```typescript
app.useGlobalFilters(new AllExceptionsFilter());
app.useGlobalFilters(new HttpExceptionFilter());
```

NestJS áp dụng filter **đăng ký sau** trước. Vì vậy `HttpException` (và mọi custom exception) do **HttpExceptionFilter** xử lý; exception không phải `HttpException` do **AllExceptionsFilter** xử lý. Cả hai đều format response theo `ApiErrorResponseDto` (success, statusCode, message, error, timestamp, path), nên client luôn nhận format lỗi thống nhất.

**File tham chiếu:**

- Custom exceptions: `src/shared/errors/custom-exceptions.ts`
- HttpExceptionFilter: `src/common/filters/http-exception.filter.ts`
- AllExceptionsFilter: `src/common/filters/all-exceptions.filter.ts`
- Đăng ký global filters: `src/main.ts`

## Frontend Integration

### Handling Success Response

```typescript
// TypeScript/JavaScript
interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  timestamp: string;
  path?: string;
}

async function getUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const result: ApiResponse<User> = await response.json();
  
  if (result.success) {
    return result.data;
  }
  throw new Error(result.message);
}
```

### Handling Error Response

```typescript
interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error?: string | string[];
  timestamp: string;
  path: string;
}

async function handleApiError(error: any) {
  if (error.response) {
    const apiError: ApiErrorResponse = error.response.data;
    console.error('API Error:', apiError.message);
    
    if (Array.isArray(apiError.error)) {
      // Validation errors
      apiError.error.forEach(err => console.error(err));
    }
  }
}
```

### Axios Interceptor Example

```typescript
import axios from 'axios';

// Response interceptor
axios.interceptors.response.use(
  (response) => {
    // Response đã được format bởi TransformInterceptor
    return response;
  },
  (error) => {
    // Error đã được format bởi ExceptionFilter
    const apiError = error.response?.data;
    if (apiError) {
      console.error('API Error:', apiError.message);
    }
    return Promise.reject(error);
  }
);
```

## Best Practices

1. **Luôn kiểm tra `success` field** trước khi xử lý data
2. **Sử dụng `statusCode`** để xác định loại response
3. **Xử lý `error` field** có thể là string, array, hoặc object
4. **Log `timestamp` và `path`** để debug dễ dàng hơn
5. **Sử dụng TypeScript interfaces** để type-safe

## Migration Notes

Nếu bạn đang migrate từ format cũ:

1. Tất cả responses sẽ tự động được format bởi TransformInterceptor
2. Tất cả errors sẽ tự động được format bởi ExceptionFilter
3. Không cần thay đổi code trong controllers (trừ khi muốn custom message)
4. Frontend cần update để handle format mới
