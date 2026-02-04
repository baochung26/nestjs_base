#!/usr/bin/env markdown
# Hướng dẫn Sử dụng CacheEvictInterceptor

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [CacheEvictInterceptor làm gì](#cacheevictinterceptor-làm-gì)
- [Decorator @CacheEvict](#decorator-cacheevict)
- [Cách đăng ký và sử dụng](#cách-đăng-ký-và-sử-dụng)
- [Evict theo request hoạt động thế nào?](#evict-theo-request-hoạt-động-thế-nào)
- [Demo trong project](#demo-trong-project)
- [Best practices](#best-practices)
- [Tham chiếu](#tham-chiếu)

---

## 🎯 Tổng quan

**CacheEvictInterceptor** dùng để **xóa cache sau khi endpoint thay đổi dữ liệu** (PATCH/PUT/DELETE/POST). Mục tiêu là đảm bảo các endpoint GET đã cache không bị “stale” sau khi dữ liệu bị cập nhật.

**Vị trí trong project:**

- Interceptor: `src/common/interceptors/cache-evict.interceptor.ts`
- Decorator: `src/common/decorators/cache-evict.decorator.ts`
- CacheInterceptor (để cache GET): `src/common/interceptors/cache.interceptor.ts`

---

## 🔄 CacheEvictInterceptor làm gì

Interceptor đọc metadata `CACHE_EVICT_KEY` (được set bởi `@CacheEvict(...)`):

- Nếu route **không** có `@CacheEvict(...)` → bỏ qua, handler chạy bình thường.
- Nếu có `@CacheEvict('some:key')` → xóa **1 key cụ thể** sau khi handler chạy xong.
- Nếu có `@CacheEvict(['k1','k2'])` → xóa **nhiều key**.
- Nếu có `@CacheEvict()` → xóa cache **dựa theo request hiện tại** (xem mục “Evict theo request”).

Việc xóa cache được thực hiện **sau khi handler trả về response** (trong `tap(...)`).

---

## 🏷️ Decorator `@CacheEvict`

**File:** `src/common/decorators/cache-evict.decorator.ts`

Các cách dùng:

```typescript
@CacheEvict()                 // Evict theo request
@CacheEvict('users:list')     // Evict 1 key cụ thể
@CacheEvict(['k1', 'k2'])     // Evict nhiều key
```

**Gợi ý naming key:** dùng dạng `domain:feature:subfeature` (ví dụ `users:list`, `admin:dashboard:stats`).

---

## 📦 Cách đăng ký và sử dụng

### 1) Gắn interceptor ở controller-level

Ưu tiên cách này: interceptor được apply cho controller, còn route nào cần evict thì đánh dấu `@CacheEvict(...)`.

```typescript
import { UseInterceptors } from '@nestjs/common';
import { CacheEvictInterceptor } from '../common/interceptors/cache-evict.interceptor';

@Controller('users')
@UseInterceptors(CacheEvictInterceptor)
export class UsersController {}
```

### 2) Kết hợp với CacheInterceptor

Bạn có thể gắn **cả 2**:

- `CacheInterceptor`: cache các endpoint GET có `@Cache(...)`
- `CacheEvictInterceptor`: xóa cache các endpoint mutate có `@CacheEvict(...)`

```typescript
@UseInterceptors(CacheInterceptor, CacheEvictInterceptor)
```

Lưu ý: `CacheInterceptor` chỉ cache khi có `@Cache(ttl)`; `CacheEvictInterceptor` chỉ evict khi có `@CacheEvict(...)` → không “đụng” nhau nếu bạn gắn cả 2 ở controller.

---

## 🔑 Evict theo request hoạt động thế nào?

Khi bạn dùng `@CacheEvict()` (không truyền key), interceptor sẽ tạo cache key theo **cùng format** với `CacheInterceptor`, nhưng **force method = GET** để match cache của endpoint đọc dữ liệu:

```
cache:GET:<url>:<query>:<params>:<userId>
```

Điều này phù hợp với các tình huống:

- `PATCH /users/:id` → sau khi update, xóa cache của `GET /users/:id`
- `DELETE /users/:id` → sau khi delete, xóa cache của `GET /users/:id`

Nếu endpoint GET dùng **custom key** (ví dụ `@Cache(300, 'users:list')`), bạn nên evict bằng `@CacheEvict('users:list')`.

---

## ✅ Demo trong project

### UsersController (đã thêm)

**File:** `src/modules/users/controllers/users.controller.ts`

- Cache list:
  - `GET /users` dùng `@Cache(300, 'users:list')`
- Cache detail:
  - `GET /users/:id` dùng `@Cache(600)` (key tự sinh)
- Evict sau mutate:
  - `PATCH /users/:id` và `DELETE /users/:id`
    - `@CacheEvict(['users:list'])` để xóa cache danh sách
    - `@CacheEvict()` để xóa cache detail theo request (match `GET /users/:id`)

---

## 💡 Best practices

1. **Luôn evict các key liên quan sau update/delete**
   - Ví dụ update user thường ảnh hưởng: `users:list`, `users:search`, `user:<id>` …

2. **Dùng key tùy chỉnh cho list/search**
   - Dễ evict: `users:list`, `admin:users:list`, `users:search:<filters>` (nếu bạn tự quản lý).

3. **Kết hợp evict theo request cho resource detail**
   - `@Cache(600)` (key tự sinh) cho `GET /resource/:id`
   - `@CacheEvict()` cho `PATCH/DELETE /resource/:id`

4. **Không evict trước khi mutate thành công**
   - Interceptor xóa cache sau handler. Nếu handler throw error, tap không “commit” xóa key (theo flow response), tránh mất cache khi thao tác thất bại.

---

## 📚 Tham chiếu

- CacheInterceptor: [CACHE_INTERCEPTOR.md](./CACHE_INTERCEPTOR.md)
- CacheModule & CacheService: [CACHE_GUIDE.md](./CACHE_GUIDE.md)

