**Tổng Quan**
Đánh giá nhanh dự án NestJS dựa trên code hiện tại. Mục tiêu là chỉ ra điểm mạnh và các điểm cần cải thiện theo mức ưu tiên, kèm file tham chiếu để dễ sửa.

**Điểm Tốt**
- Kiến trúc module rõ ràng, tách bạch `common`, `infrastructure`, `modules`, `shared` giúp mở rộng và bảo trì tốt. Tham chiếu: `src/app.module.ts`, `src/modules`, `src/infrastructure`.
- Cấu hình tập trung + validation môi trường bằng Joi giúp an toàn khi deploy. Tham chiếu: `src/config/configuration.ts`, `src/config/validation.schema.ts`.
- Bảo mật cơ bản đầy đủ: Helmet, CORS tùy biến, rate limit preset. Tham chiếu: `src/infrastructure/security/security.config.ts`, `src/infrastructure/security/security.module.ts`.
- Auth tương đối đầy đủ: JWT, refresh token (Redis), Google OAuth. Tham chiếu: `src/modules/auth`.
- Logging có correlation ID, cấu trúc log tốt, hỗ trợ debugging. Tham chiếu: `src/infrastructure/logger/logger.module.ts`, `src/common/middleware/correlation-id.middleware.ts`.
- Chuẩn hóa response và error response, có interceptor và DTO chung. Tham chiếu: `src/common/interceptors/transform.interceptor.ts`, `src/shared/response`.
- Có health checks cho DB/Redis/Disk/Memory, phù hợp production monitoring. Tham chiếu: `src/infrastructure/health`.
- Queue + Scheduler đầy đủ cho background jobs và maintenance. Tham chiếu: `src/infrastructure/queue`, `src/infrastructure/scheduler`.
- Docker Compose tích hợp Postgres + Redis + pgAdmin + healthcheck, dễ chạy local. Tham chiếu: `docker-compose.yml`.
- Tài liệu phong phú, nhiều guide theo từng module. Tham chiếu: `docs/*`.

**Điểm Cần Cải Thiện**
- OAuth callback đẩy `access_token`/`refresh_token` và user data qua query string, dễ rò rỉ qua logs, history, referrer. Nên chuyển sang httpOnly cookie hoặc cơ chế code exchange. Tham chiếu: `src/modules/auth/controllers/auth.controller.ts`.
- Có cả `AllExceptionsFilter` và `HttpExceptionFilter` global → dư thừa, dễ khó kiểm soát. Nên giữ một filter chính. Tham chiếu: `src/main.ts`, `src/common/filters`.
- Test coverage rất mỏng (chỉ 1 test service). Nên bổ sung tests cho auth, RBAC, refresh token, cache, và e2e. Tham chiếu: `test/modules/users/users.service.spec.ts`.

**Đã Xử Lý**
- Quyền truy cập Users API đã được siết: các endpoint quản trị (`/users`, `/users/:id`) chỉ cho `admin`, user thường dùng `/users/profile`. Tham chiếu: `src/modules/users/controllers/users.controller.ts`.
- LoggingInterceptor đã mở rộng sanitize cho `refreshToken` và các trường nhạy cảm theo pattern (`password`, `token`, `secret`, `authorization`, `cookie`). Tham chiếu: `src/common/interceptors/logging.interceptor.ts`.
- CacheInterceptor đã dùng `cached !== undefined` để không bỏ qua cache với giá trị falsy (0, '', false). Tham chiếu: `src/common/interceptors/cache.interceptor.ts`.
- TTL cache đã thống nhất theo giây; refresh token lưu TTL theo giây (không còn nhân 1000). Tham chiếu: `src/infrastructure/cache/cache.module.ts`, `src/modules/auth/services/refresh-token.service.ts`.
- Update email đã kiểm tra trùng lặp và trả về ConflictException phù hợp. Tham chiếu: `src/modules/users/services/users.service.ts`.
- `AuthController.googleLogin()` đã trả về `BadRequestException` (400) thay vì 500. Tham chiếu: `src/modules/auth/controllers/auth.controller.ts`.
- Storage đã chuyển sang ghi file async, dùng Multer memoryStorage + giới hạn file size theo config. Tham chiếu: `src/infrastructure/storage/storage.service.ts`, `src/infrastructure/storage/storage.module.ts`.
- `StorageService.getFileUrl()` đã dùng `app.baseUrl` (từ `APP_BASE_URL`) để build URL. Tham chiếu: `src/infrastructure/storage/storage.service.ts`, `src/config/configuration.ts`.
- Tài liệu port đã đồng bộ: Docker default dùng `APP_HOST_PORT=3001`, local dùng `APP_PORT=3000`. Tham chiếu: `README.md`, `docker-compose.yml`, `docs/API_DOCUMENTATION.md`.
- Tài liệu đã đồng bộ base path `/api/v1` trong các ví dụ endpoint. Tham chiếu: `README.md`, `docs/*`.
- `uploads/` đã được ignore trong `.gitignore` để tránh commit file upload. Tham chiếu: `.gitignore`, `uploads/`.
**Ưu Tiên Đề Xuất**
1. Thay luồng OAuth redirect tokens qua query bằng cookie/httpOnly hoặc code exchange.
2. Giữ một exception filter chính (AllExceptionsFilter hoặc HttpExceptionFilter) để tránh trùng lặp.
3. Tăng test coverage cho auth + RBAC + refresh token + e2e.

**Ghi Chú**
- Đánh giá dựa trên code hiện tại; chưa chạy test hay kiểm tra runtime behavior.
