# Hướng dẫn Types trong NestJS Project

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Cấu trúc Types](#cấu-trúc-types)
- [Common Types](#common-types)
- [Types vs DTOs vs Entities](#types-vs-dtos-vs-entities)
- [Constants và Derived Types](#constants-và-derived-types)
- [Types cho Queue / Job](#types-cho-queue--job)
- [Best Practices](#best-practices)

---

## 🎯 Tổng quan

Project dùng **TypeScript** với các nhóm type chính:

- **Common types** (`src/common/types/`) – interface/type dùng chung (API response, pagination, auth)
- **DTOs** – class có validation, dùng cho request/response API (thường kèm `class-validator`, `@ApiProperty`)
- **Entities** – class map với bảng DB (TypeORM)
- **Constants + derived types** – enum-like từ object `as const` và `typeof`

---

## 📁 Cấu trúc Types

```
src/
├── common/
│   ├── types/
│   │   └── index.ts          # PaginationOptions, ApiResponse, JwtPayload, RequestUser, GoogleProfile
│   └── constants/
│       ├── user.constants.ts # USER_ROLES, UserRole
│       └── ...
├── shared/
│   ├── response/            # ApiResponseDto, ApiErrorResponseDto (class – dùng cho runtime + Swagger)
│   └── pagination/          # PaginationMetaDto, PaginatedResponseDto (class)
└── modules/
    └── **/dtos/             # CreateUserDto, LoginDto, ... (class)
```

- **Interface/type** trong `common/types`: dùng cho logic, type-check, không có decorator.
- **Class DTO/Entity**: dùng cho runtime, validation, Swagger, DB mapping.

---

## 📦 Common Types

Định nghĩa trong `src/common/types/index.ts`:

### Pagination

```typescript
export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
```

- **PaginationOptions**: input cho service (page, limit).
- **PaginationMeta**: metadata trả về (total, totalPages).
- **PaginatedResult\<T\>**: kết quả phân trang có `data` và `meta`.

Dùng khi viết service/repository trả về phân trang; controller có thể map sang `PaginatedResponseDto` để trả API.

### API Response (union type)

```typescript
export interface ApiSuccessResponse<T = any> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path?: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error?: string | string[] | object;
  timestamp: string;
  path: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;
```

- **ApiSuccessResponse\<T\>**: response thành công (có `data`).
- **ApiErrorResponse**: response lỗi (có `error`).
- **ApiResponse\<T\>**: union type để type-check khi xử lý response.

Runtime thực tế dùng **class** `ApiResponseDto` / `ApiErrorResponseDto` (trong `shared/response/`) để build object và Swagger.

### Auth

```typescript
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RequestUser {
  id: string;
  email: string;
  role: string;
}

export interface GoogleProfile {
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
}
```

- **JwtPayload**: payload trong JWT (sau decode); dùng trong strategy, guard.
- **RequestUser**: user gắn vào `request.user` sau khi validate JWT (có thể map từ entity hoặc JwtPayload).
- **GoogleProfile**: profile từ Google OAuth; dùng khi đăng ký/đăng nhập Google.

Ví dụ dùng trong strategy:

```typescript
// jwt.strategy.ts – nên type payload
async validate(payload: JwtPayload) {
  const user = await this.usersService.findOne(payload.sub);
  if (!user || !user.isActive) throw new UnauthorizedException();
  return user; // request.user
}
```

```typescript
// Controller – type user từ decorator
@Get('profile')
getProfile(@CurrentUser() user: RequestUser) {
  return user;
}
```

---

## Types vs DTOs vs Entities

|                | Type/Interface                     | DTO (class)                                             | Entity (class)      |
| -------------- | ---------------------------------- | ------------------------------------------------------- | ------------------- |
| **Vị trí**     | `common/types`, inline             | `**/dtos/`, `shared/response`, `shared/pagination`      | `**/entities/`      |
| **Mục đích**   | Chỉ type-check, mô tả shape        | Request/response API, validation, Swagger               | Map với DB, TypeORM |
| **Runtime**    | Bị xóa khi compile                 | Tồn tại (instance)                                      | Tồn tại (instance)  |
| **Validation** | Không                              | `class-validator`                                       | Không (hoặc tùy)    |
| **Ví dụ**      | `JwtPayload`, `PaginatedResult<T>` | `CreateUserDto`, `ApiResponseDto`, `PaginationQueryDto` | `User`              |

- **Type/interface**: dùng cho tham số, biến, hàm, generic (ví dụ `Promise<PaginatedResult<User>>`).
- **DTO**: dùng cho body/query/response, có `@IsString()`, `@ApiProperty()`, v.v.
- **Entity**: dùng cho repository, query, relation; có `@Column()`, `@PrimaryGeneratedColumn()`.

Xem thêm: [MAPPER_PATTERN_GUIDE.md](./MAPPER_PATTERN_GUIDE.md) (Entity ↔ DTO).

---

## Constants và Derived Types

Dùng object + `as const` rồi suy ra type để có enum-like an toàn kiểu:

```typescript
// src/common/constants/user.constants.ts
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
// 'user' | 'admin'
```

- **USER_ROLES**: giá trị dùng trong code và validation.
- **UserRole**: type cho biến/parameter chỉ nhận `'user' | 'admin'`.

Tương tự có thể làm cho status, job name, queue name, v.v.

---

## Types cho Queue / Job

### Job data chung

```typescript
// queue.service.ts
export interface JobData {
  [key: string]: any;
}
```

Dùng cho default queue khi payload linh hoạt.

### Email job

```typescript
// Khi add job
{
  to: string;
  subject: string;
  template?: string;
  data?: any;
}

// Trong processor – type Job generic
job: Job<{ to: string; subject: string; text?: string; html?: string; template?: string; data?: any }>
```

Nên tách thành interface (ví dụ `EmailJobData`) trong `common/types` hoặc `queue/` và dùng lại ở service + processor.

### Notification job

```typescript
{
  userId: string;
  type: string;
  message: string;
  data?: any;
}
```

Có thể định nghĩa `NotificationJobData` và dùng `Job<NotificationJobData>` trong processor.

---

## Best Practices

### 1. Đặt type/interface dùng chung ở một chỗ

- API/pagination/auth: `src/common/types/index.ts`.
- Chỉ dùng trong một module: đặt trong module đó (ví dụ `queue.types.ts`, `email-job.types.ts`).

### 2. Dùng generic cho kết quả có cấu trúc cố định

```typescript
PaginatedResult<User>;
ApiResponse<UserDto>;
Promise<PaginatedResult<Order>>;
```

### 3. Tránh `any` khi có thể

- Dùng `unknown` rồi narrow (type guard) nếu chưa biết shape.
- Job data: định nghĩa interface rồi dùng `Job<EmailJobData>`.

### 4. Phân biệt optional (`?`) và có thể undefined

- `field?: string` → có thể không có key hoặc `undefined`.
- `field: string | undefined` → luôn có key, giá trị có thể `undefined`.
- Dùng `??` cho default thay vì `||` khi cần phân biệt `0`, `''`, `false`.

### 5. Request/response API

- **Type**: mô tả shape cho logic, type guard.
- **DTO class**: validation + Swagger; dùng trong controller và interceptor/filter.

### 6. Auth

- Strategy validate trả về object có shape **RequestUser** (hoặc entity, tùy cách thiết kế).
- Decorator `@CurrentUser()` nên được type là `RequestUser` (hoặc type bạn đã chuẩn hóa).

### 7. Export từ barrel

```typescript
// common/types/index.ts – export tất cả type dùng chung
export interface PaginationOptions { ... }
export type ApiResponse<T> = ...;
export interface JwtPayload { ... }
// ...
```

Import: `import { JwtPayload, RequestUser, PaginatedResult } from '@/common/types';` (hoặc path tương đối tùy cấu hình).

---

## Tóm tắt

| Nhu cầu                         | Dùng gì             | Ví dụ                                          |
| ------------------------------- | ------------------- | ---------------------------------------------- |
| Type cho payload JWT            | Interface           | `JwtPayload`                                   |
| User trên request               | Interface           | `RequestUser`                                  |
| Kết quả phân trang (logic)      | Interface generic   | `PaginatedResult<T>`                           |
| Response API (logic/type guard) | Union type          | `ApiResponse<T>`                               |
| Body/query API + validation     | DTO class           | `CreateUserDto`, `PaginationQueryDto`          |
| Response API + Swagger          | DTO class           | `ApiResponseDto<T>`, `PaginatedResponseDto<T>` |
| Role, status cố định            | Const object + type | `USER_ROLES`, `UserRole`                       |
| Job data queue                  | Interface           | `EmailJobData`, `NotificationJobData`          |

Kết hợp tốt **common types** với **DTOs** và **entities** giúp code rõ ràng, dễ bảo trì và an toàn kiểu hơn.
