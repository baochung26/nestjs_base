# NestJS Backend Base

Backend NestJS theo hướng production-ready, tập trung vào kiến trúc rõ ràng, bảo mật, khả năng vận hành, và dễ mở rộng.

## Mục tiêu dự án

Dự án được xây dựng để làm nền tảng backend thực tế với các thành phần thường gặp:

- Authentication với JWT (access + refresh token)
- Google OAuth login flow
- Phân quyền theo vai trò `USER` / `ADMIN`
- Quản lý người dùng, admin APIs, health checks
- PostgreSQL + TypeORM + Redis + Bull Queue
- Swagger, logging có correlation ID, scheduler, cache, mail, storage
- Chuẩn hóa response/error qua interceptor + filter

## Công nghệ chính

- NestJS 10, TypeScript
- PostgreSQL + TypeORM
- Redis + Bull + Bull Board
- Passport (Local, JWT, Google OAuth)
- Swagger / OpenAPI
- `nestjs-pino` (structured logging)
- Jest (unit/e2e)

## Cấu trúc mã nguồn

```text
src/
  common/           # decorators, guards, interceptors, filters, pipes, middleware
  config/           # config + Joi validation cho env
  infrastructure/   # database, cache, queue, scheduler, mail, storage, health, logger
  modules/          # auth, users, admin
  shared/           # base entity, response dto/helper, pagination
```

## Bắt đầu nhanh

### 1) Cài đặt

```bash
npm install
cp .env.example .env
```

### 2) Chạy bằng Docker (khuyến nghị)

```bash
docker compose up -d
```

Mặc định:

- API: `http://localhost:3001/api/v1`
- Swagger: `http://localhost:3001/api/docs`
- pgAdmin: `http://localhost:5050`

### 3) Chạy local không Docker

Yêu cầu: PostgreSQL + Redis đã chạy sẵn.

Cập nhật `.env` cho phù hợp môi trường local, sau đó:

```bash
npm run start:dev
```

Mặc định local:

- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/docs`

## Scripts hữu ích

```bash
npm run start:dev
npm run build
npm run lint
npm test
npm run test:cov

npm run seed
npm run seed:clear
npm run seed:refresh

npm run migration:generate -- src/infrastructure/database/migrations/<name>
npm run migration:run
npm run migration:revert
npm run migration:show
```

## API chính

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- `GET /auth/google`, `GET /auth/google/callback`
- `GET /users/profile`, `PATCH /users/profile`
- `GET /admin/*` (yêu cầu role `ADMIN`)
- `GET /health`, `GET /health/db`, `GET /health/redis`, `GET /health/memory`, `GET /health/disk`

Ngoài Swagger, project có các endpoint nội bộ cho Queue và Storage (xem tài liệu API chi tiết).

## Tài liệu

Tài liệu chi tiết nằm trong thư mục `docs`:

- [Documentation Index](./docs/README.md)
- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Architecture Overview](./docs/ARCHITECTURE_OVERVIEW.md)
- [Development Setup](./docs/DEVELOPMENT_SETUP.md)
- [Google OAuth Setup](./docs/GOOGLE_OAUTH_SETUP.md)
- [Google Login Flow](./docs/GOOGLE_LOGIN_FLOW.md)

## Biến môi trường quan trọng

Tối thiểu cần cấu hình:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET` (khuyến nghị >= 32 ký tự)

Nếu dùng Google login:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `FRONTEND_URL`

## Bảo mật

- Không commit credentials thật vào repository
- Dùng secret mạnh cho JWT/OAuth ở môi trường thật
- Tách credentials riêng cho dev/staging/production

## License

MIT
