# Hướng dẫn Sử dụng CacheInterceptor

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Interceptor trong NestJS](#interceptor-trong-nestjs)
- [CacheInterceptor làm gì](#cacheinterceptor-làm-gì)
- [Đăng ký CacheInterceptor](#đăng-ký-cacheinterceptor)
- [Decorators](#decorators)
- [Cách sử dụng](#cách-sử-dụng)
- [Cache key](#cache-key)
- [Ví dụ thực tế](#ví-dụ-thực-tế)
- [Khi nào dùng / không dùng](#khi-nào-dùng--không-dùng)
- [Best practices](#best-practices)
- [Tham chiếu](#tham-chiếu)

---

## 🎯 Tổng quan

**CacheInterceptor** là interceptor dùng để **tự động cache HTTP response** của các route. Khi request trùng cache key và còn trong thời gian TTL, response được trả từ Redis mà **không gọi** handler, giúp giảm tải service và database.

**Vị trí trong project:**

- Interceptor: `src/common/interceptors/cache.interceptor.ts`
- Decorators: `src/common/decorators/cache.decorator.ts`
- Đăng ký: `src/infrastructure/cache/cache.module.ts`

**Yêu cầu:** Project đã bật **CacheModule** (Redis). Xem [CACHE_GUIDE.md](./CACHE_GUIDE.md) để cấu hình Redis.

---

## 🔀 Interceptor trong NestJS

**Interceptor** chạy **trước và sau** khi route handler thực thi. Nó có thể:

- Biến đổi kết quả trả về
- Mở rộng hành vi (log, cache, timeout)
- Trả response khác thay vì gọi handler (ví dụ: trả từ cache)

Luồng xử lý:

```
Request → Guard → Interceptor (trước) → Route Handler → Interceptor (sau) → Response
```

Với CacheInterceptor: nếu **có cache** thì trả luôn, **không gọi** handler; nếu **không có cache** thì gọi handler rồi lưu response vào cache.

---

## ⚙️ CacheInterceptor làm gì

1. **Đọc metadata** từ decorator: có `@SkipCache()` không, TTL và cache key từ `@Cache(ttl, key?)`.
2. **Bỏ qua cache:** Nếu `@SkipCache()` hoặc không có `@Cache(ttl)` → gọi handler bình thường.
3. **Tạo cache key:** Dùng key từ `@Cache(ttl, key)` nếu có, không thì sinh từ `method + url + query + params + userId`.
4. **Đọc cache:** Gọi `CacheService.get(cacheKey)`. Nếu có → `return of(cached)` (handler không chạy).
5. **Gọi handler và ghi cache:** `next.handle().pipe(tap(...))` → sau khi có response thì `CacheService.set(cacheKey, data, ttl)`.

**Lưu ý:** Chỉ những route có **@Cache(ttl)** (và không có `@SkipCache()`) mới bị cache. Route không có `@Cache()` vẫn chạy bình thường dù controller có `@UseInterceptors(CacheInterceptor)`.

---

## 📦 Đăng ký CacheInterceptor

CacheInterceptor đã được đăng ký trong **CacheModule** (global):

**File:** `src/infrastructure/cache/cache.module.ts`

```typescript
import { CacheInterceptor } from '../../common/interceptors/cache.interceptor';

@Global()
@Module({
  // ...
  providers: [CacheService, CacheInterceptor],
  exports: [NestCacheModule, CacheService, CacheInterceptor],
})
export class CacheModule {}
```

Vì **CacheModule** là `@Global()` và export `CacheInterceptor`, bạn **không cần** import CacheModule vào từng module. Chỉ cần dùng `@UseInterceptors(CacheInterceptor)` và `@Cache()` trong controller.

---

## 🏷️ Decorators

### `@Cache(ttl, key?)`

Bật cache cho route.

| Tham số | Kiểu     | Mặc định  | Mô tả                                                       |
| ------- | -------- | --------- | ----------------------------------------------------------- |
| `ttl`   | `number` | `3600`    | Thời gian sống cache (giây).                                |
| `key`   | `string` | (tự sinh) | Cache key tùy chỉnh. Nếu không truyền, key sinh từ request. |

**Ví dụ:**

```typescript
@Cache(3600)                      // Cache 1 giờ, key tự sinh
@Cache(300)                       // Cache 5 phút
@Cache(3600, 'admin:dashboard:stats')  // Cache 1 giờ, key cố định
```

### `@SkipCache()`

Tắt cache cho route/controller đó (ưu tiên hơn `@Cache`).

**Ví dụ:**

```typescript
@SkipCache()
@Get('sensitive')
getSensitive() { ... }
```

**Thứ tự ưu tiên metadata:** handler (method) override controller. Ví dụ: controller có `@Cache(3600)`, method có `@SkipCache()` → method không bị cache.

---

## 📖 Cách sử dụng

### Áp dụng cho cả controller

Gắn **một lần** ở controller, sau đó chỉ cần đánh dấu method cần cache bằng `@Cache(ttl, key?)`.

```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '../../../common/interceptors/cache.interceptor';
import { Cache, SkipCache } from '../../../common/decorators/cache.decorator';

@Controller('products')
@UseInterceptors(CacheInterceptor)
export class ProductsController {
  @Get()
  @Cache(1800) // Cache 30 phút, key tự sinh
  list() {
    return this.productsService.findAll();
  }

  @Get('featured')
  @Cache(3600, 'products:featured')
  getFeatured() {
    return this.productsService.getFeatured();
  }

  @Get('fresh')
  @SkipCache() // Luôn gọi handler, không cache
  getFresh() {
    return this.productsService.getFresh();
  }
}
```

### Chỉ áp dụng cho một vài route

Gắn interceptor và decorator ngay trên method:

```typescript
@Controller('reports')
export class ReportsController {
  @Get('summary')
  @UseInterceptors(CacheInterceptor)
  @Cache(300, 'reports:summary')
  getSummary() {
    return this.reportsService.getSummary();
  }
}
```

### Kết hợp Guard và Interceptor

Thứ tự khai báo: Guard chạy trước, sau đó mới tới Interceptor. Cache chỉ lưu response **sau** khi Guard đã cho phép.

```typescript
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@UseInterceptors(CacheInterceptor)
export class AdminDashboardController {
  @Get()
  @Cache(300, 'admin:dashboard:stats')
  getStatistics() {
    return this.adminDashboardService.getStatistics();
  }
}
```

---

## 🔑 Cache key

### Key tùy chỉnh (`@Cache(ttl, key)`)

Dùng khi muốn **một key chung** cho mọi request tới endpoint (ví dụ thống kê dashboard cho mọi admin):

```typescript
@Cache(300, 'admin:dashboard:stats')
getStatistics() { ... }
```

### Key tự sinh (không truyền `key`)

Interceptor sinh key từ request:

```typescript
`cache:${method}:${url}:${queryString}:${paramsString}:${userId}`;
```

- **method:** GET, POST, ...
- **url:** path (ví dụ `/admin/dashboard`)
- **query:** `req.query` (JSON)
- **params:** `req.params` (JSON)
- **userId:** `req.user?.id` hoặc `'anonymous'`

Ví dụ: `cache:GET:/api/v1/users:{}:{"id":"123"}:user-uuid-456` → mỗi user, mỗi URL/query/params khác nhau có cache riêng.

**Khi nào dùng key tùy chỉnh:**

- Dữ liệu dùng chung cho mọi user (thống kê, config, danh sách public).
- Muốn key ngắn, dễ đọc hoặc dễ invalidation (xóa theo pattern).

**Khi nào để key tự sinh:**

- Dữ liệu theo user (profile, dashboard theo user).
- Dữ liệu theo query (filter, pagination) → mỗi bộ tham số một cache.

---

## 📌 Ví dụ thực tế

### Admin Dashboard (đang dùng trong project)

**File:** `src/modules/admin/dashboard/admin-dashboard.controller.ts`

```typescript
import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '../../../common/interceptors/cache.interceptor';
import { Cache } from '../../../common/decorators/cache.decorator';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@UseInterceptors(CacheInterceptor)
export class AdminDashboardController {
  @Get()
  @Cache(300, 'admin:dashboard:stats') // Cache 5 phút, key chung cho mọi admin
  getStatistics() {
    return this.adminDashboardService.getStatistics();
  }
}
```

- **TTL 300 (5 phút):** thống kê không cần realtime, giảm tải DB.
- **Key cố định:** dữ liệu dashboard giống nhau cho mọi admin, dùng chung một cache.

### API danh sách có phân trang

Key tự sinh → mỗi tổ hợp `?page=1&limit=10` có cache riêng:

```typescript
@Get()
@Cache(600)  // 10 phút, key từ url + query + user
list(@Query('page') page: number, @Query('limit') limit: number) {
  return this.usersService.findAll({ page, limit });
}
```

### Route nhạy cảm không cache

```typescript
@Get('me')
@SkipCache()
getProfile(@Request() req) {
  return this.usersService.findById(req.user.id);
}
```

---

## ✅ Khi nào dùng / không dùng

### Nên dùng CacheInterceptor khi

- GET endpoint đọc dữ liệu ít thay đổi (thống kê, config, danh sách public).
- Response giống nhau cho nhiều user (dùng key cố định) hoặc cần cache theo user/query (key tự sinh).
- Muốn giảm tải DB/service mà không đụng sâu vào logic service.

### Không nên / cẩn thận khi

- Dữ liệu realtime hoặc thay đổi liên tục → TTL rất ngắn hoặc không cache.
- Dữ liệu nhạy cảm, riêng tư → dùng `@SkipCache()` hoặc không gắn `@Cache()`.
- POST/PUT/DELETE thay đổi dữ liệu → thường không cache response; nếu cần invalidation thì xem [CACHE_GUIDE.md](./CACHE_GUIDE.md) (CacheEvict, xóa key thủ công).

---

## 💡 Best practices

1. **Đặt TTL hợp lý**
   - Dữ liệu gần như tĩnh: 1–24h (`3600`–`86400`).
   - Dữ liệu thay đổi vừa: 5–15 phút (`300`–`900`).
   - Cần gần realtime: vài chục giây hoặc không cache.

2. **Đặt tên key rõ ràng (khi dùng key tùy chỉnh)**
   - Ví dụ: `admin:dashboard:stats`, `products:featured`, `config:app`.

3. **Dùng @SkipCache() cho endpoint nhạy cảm**
   - Profile, balance, dữ liệu cá nhân, token, v.v.

4. **Không cache cho method có side effect**
   - Chỉ cache GET đọc dữ liệu; tránh cache POST/PUT/DELETE trừ khi hiểu rõ.

5. **Test cache hit/miss**
   - Gọi 2 lần giống hệt (cùng user, cùng query) → lần 2 nên trả nhanh từ cache (kiểm tra Redis hoặc log nếu cần).

---

## 📚 Tham chiếu

- **Cache Service, cấu hình Redis, CacheEvict:** [CACHE_GUIDE.md](./CACHE_GUIDE.md)
- **Interceptor:** `src/common/interceptors/cache.interceptor.ts`
- **Decorator:** `src/common/decorators/cache.decorator.ts`
