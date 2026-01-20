# NestJS Demo Project

Dự án NestJS đầy đủ với Docker, bao gồm các module: Auth, User, Admin, và Queue System với Redis.

## 📋 Mục lục

- [Tính năng](#tính-năng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt và Setup](#cài-đặt-và-setup)
- [Khởi tạo dự án](#khởi-tạo-dự-án)
- [Sử dụng các Module](#sử-dụng-các-module)
- [API Endpoints](#api-endpoints)
- [Docker Commands](#docker-commands)
- [Development](#development)

## ✨ Tính năng

- ✅ **Authentication & Authorization** - JWT-based authentication với role-based access control
- ✅ **User Management** - CRUD operations cho users
- ✅ **Admin Panel** - Dashboard, User management, Settings
- ✅ **Queue System** - Background job processing với Bull và Redis
- ✅ **Database** - PostgreSQL với TypeORM
- ✅ **Cache System** - Redis-based caching với decorators và interceptors
- ✅ **Scheduler System** - Cron jobs cho cleanup, retries, sync tasks
- ✅ **Mail System** - Email sending với Nodemailer và templates
- ✅ **Storage System** - Local file storage với upload/download/delete
- ✅ **Health Checks** - Health monitoring với @nestjs/terminus (database, Redis, memory, disk)
- ✅ **Security** - CORS, Helmet security headers, Rate limiting với @nestjs/throttler
- ✅ **Docker Support** - Full Docker setup với docker-compose
- ✅ **Validation** - Request validation với class-validator
- ✅ **Error Handling** - Global exception filters
- ✅ **Response Transformation** - Global interceptors
- ✅ **Logging** - Structured logging với Pino và correlation ID tracing

## 📁 Cấu trúc dự án

```
src/
├── common/                    # Common utilities
│   ├── decorators/            # Custom decorators (@CurrentUser, @Roles)
│   ├── filters/               # Exception filters
│   ├── guards/                # Auth guards (JWT, Roles)
│   ├── interceptors/         # Response interceptors & logging
│   ├── middleware/           # Middleware (correlation ID)
│   └── utils/                # Utility functions
├── config/                    # Configuration files
│   ├── configuration.ts      # Config loader
│   └── validation.ts         # Environment validation
├── infrastructure/            # Infrastructure modules
│   ├── database/              # Database configuration
│   │   ├── database.module.ts
│   │   └── seed/             # Data seeder
│   ├── queue/                 # Queue module (Bull + Redis)
│   └── logger/                # Logger module (Pino)
├── modules/                    # Business modules
│   ├── auth/                  # Authentication module
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── strategies/        # Passport strategies
│   │   └── guards/
│   ├── users/                 # User module
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── entities/
│   │   └── dtos/
│   └── admin/                 # Admin module
│       ├── users/             # Admin user management
│       ├── settings/          # Admin settings
│       └── dashboard/         # Admin dashboard
├── shared/                     # Shared utilities
│   ├── response/              # API response DTOs
│   ├── pagination/            # Pagination DTOs
│   └── errors/                # Custom exceptions
├── app.module.ts              # Root module
└── main.ts                    # Application entry point
```

## 🔧 Yêu cầu hệ thống

- **Node.js** >= 18.x
- **npm** >= 9.x hoặc **yarn**
- **Docker** và **Docker Compose** (khuyến nghị)
- **PostgreSQL** (nếu chạy local không dùng Docker)
- **Redis** (nếu chạy local không dùng Docker)

## 🚀 Cài đặt và Setup

### Phương pháp 1: Sử dụng Docker (Khuyến nghị)

#### Bước 1: Clone và vào thư mục dự án

```bash
cd nestjs_demo2
```

#### Bước 2: Tạo file .env

File `.env` đã được tạo sẵn với các giá trị mặc định. Bạn có thể chỉnh sửa nếu cần:

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=nestjs_db

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production-please-use-strong-secret
JWT_EXPIRES_IN=7d

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
FRONTEND_URL=http://localhost:3001

# Application Configuration
APP_PORT=3000
NODE_ENV=development

# pgAdmin Configuration
PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASSWORD=admin
PGADMIN_PORT=5050
```

**⚠️ Lưu ý:** Trước khi deploy production, hãy thay đổi `JWT_SECRET`, `DB_PASSWORD` và `PGADMIN_PASSWORD` thành các giá trị mạnh và bảo mật.

#### Bước 3: Build và chạy containers

```bash
# Build và chạy tất cả services (PostgreSQL, Redis, App)
docker-compose up -d

# Xem logs của app
docker-compose logs -f app

# Xem logs của tất cả services
docker-compose logs -f
```

#### Bước 4: Kiểm tra ứng dụng

Ứng dụng sẽ chạy tại: `http://localhost:3000/api`

#### Bước 5: Truy cập pgAdmin (Quản lý Database)

pgAdmin đã được tích hợp để quản lý PostgreSQL database:

1. **Truy cập pgAdmin:** Mở trình duyệt và vào `http://localhost:5050` (hoặc port bạn đã cấu hình)

2. **Đăng nhập:**
   - Email: `admin@admin.com` (hoặc giá trị trong `PGADMIN_EMAIL`)
   - Password: `admin` (hoặc giá trị trong `PGADMIN_PASSWORD`)

3. **Kết nối với PostgreSQL Server:**
   - Click chuột phải vào **Servers** → **Register** → **Server**
   - Tab **General:**
     - Name: `NestJS PostgreSQL` (tên tùy chọn)
   - Tab **Connection:**
     - Host name/address: `postgres` (tên service trong docker-compose)
     - Port: `5432`
     - Maintenance database: `nestjs_db` (hoặc giá trị trong `DB_NAME`)
     - Username: `postgres` (hoặc giá trị trong `DB_USER`)
     - Password: `postgres` (hoặc giá trị trong `DB_PASSWORD`)
     - ✅ Check **Save password** để lưu mật khẩu
   - Click **Save**

4. **Sử dụng pgAdmin:**
   - Xem và quản lý databases, tables, data
   - Chạy SQL queries
   - Xem và chỉnh sửa schema
   - Export/Import data

**Lưu ý:** Trong môi trường Docker, hostname của PostgreSQL là `postgres` (tên service), không phải `localhost`.

Xem hướng dẫn chi tiết tại [docs/PGADMIN_GUIDE.md](docs/PGADMIN_GUIDE.md)

### Phương pháp 2: Chạy Local (không dùng Docker)

#### Bước 1: Cài đặt dependencies

```bash
npm install
```

#### Bước 2: Setup Database và Redis

- **PostgreSQL:** Đảm bảo PostgreSQL đang chạy và tạo database `nestjs_db`
- **Redis:** Đảm bảo Redis server đang chạy trên port 6379

#### Bước 3: Cập nhật .env

Cập nhật file `.env` với thông tin database và Redis local:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=nestjs_db

REDIS_HOST=localhost
REDIS_PORT=6379
```

#### Bước 4: Chạy ứng dụng

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## 🎯 Khởi tạo dự án

### 1. Tạo User đầu tiên (Admin)

Sau khi ứng dụng chạy, bạn có thể tạo user đầu tiên qua API:

```bash
# Đăng ký user mới
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

Sau đó, bạn cần cập nhật role của user này thành `admin` trực tiếp trong database hoặc thông qua API (nếu đã có admin khác).

### 2. Đăng nhập và lấy JWT Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

Response sẽ chứa `access_token` mà bạn cần sử dụng cho các request tiếp theo.

### 3. Seed dữ liệu mẫu (Khuyến nghị)

Chạy seeder để tạo users mẫu:

```bash
npm run seed
```

Seeder sẽ tạo các users mẫu:
- **admin@example.com** / **admin123** (Admin role)
- **user@example.com** / **user123** (User role)
- **jane@example.com** / **user123** (User role)
- **inactive@example.com** / **user123** (Inactive user)

Xem chi tiết tại [docs/SEEDER_GUIDE.md](docs/SEEDER_GUIDE.md)

### 4. Sử dụng Token

Thêm token vào header của các request:

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📚 Sử dụng các Module

### 1. Queue Module

Queue module sử dụng Bull và Redis để xử lý background jobs. Có 3 queues mặc định:
- `default` - Queue mặc định
- `email` - Queue cho email jobs
- `notification` - Queue cho notification jobs

**📖 Xem hướng dẫn chi tiết tại:** [docs/QUEUE_GUIDE.md](docs/QUEUE_GUIDE.md)

#### Sử dụng QueueService trong code

```typescript
import { Injectable } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class YourService {
  constructor(private queueService: QueueService) {}

  async sendWelcomeEmail(userEmail: string, userName: string) {
    // Thêm email job vào queue
    await this.queueService.addEmailJob({
      to: userEmail,
      subject: 'Welcome to our platform!',
      template: 'welcome',
      data: {
        name: userName,
      },
    });
  }

  async sendNotification(userId: string, message: string) {
    // Thêm notification job vào queue
    await this.queueService.addNotificationJob({
      userId: userId,
      type: 'info',
      message: message,
      data: {},
    });
  }

  async addCustomJob(data: any) {
    // Thêm job vào default queue
    await this.queueService.addJob(data, {
      attempts: 3,
      delay: 5000, // Delay 5 seconds
    });
  }
}
```

#### Queue API Endpoints (Admin only)

```bash
# Lấy thống kê tất cả queues
GET /api/queue/stats
Authorization: Bearer YOUR_TOKEN

# Lấy thống kê queue cụ thể
GET /api/queue/stats/email
Authorization: Bearer YOUR_TOKEN

# Thêm email job
POST /api/queue/email
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
{
  "to": "user@example.com",
  "subject": "Test Email",
  "template": "welcome",
  "data": { "name": "John" }
}

# Thêm notification job
POST /api/queue/notification
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
{
  "userId": "user-id",
  "type": "info",
  "message": "New notification",
  "data": {}
}

# Dọn dẹp completed jobs
DELETE /api/queue/clean/default
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
{
  "type": "completed",
  "grace": 1000
}
```

#### Tùy chỉnh Processors

Bạn có thể tạo processors mới trong `src/queue/queue.processor.ts`:

```typescript
@Processor('your-queue-name')
export class YourQueueProcessor {
  private readonly logger = new Logger(YourQueueProcessor.name);

  @Process('your-job-name')
  async handleYourJob(job: Job<YourJobData>) {
    this.logger.log(`Processing job ${job.id}`);
    
    // Xử lý job của bạn
    // ...
    
    return { success: true };
  }
}
```

### 2. Auth Module

#### Đăng ký user mới

```typescript
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Đăng nhập (Email/Password)

```typescript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Đăng nhập với Google OAuth

**Bước 1:** User truy cập endpoint để bắt đầu OAuth flow:

```typescript
GET /api/auth/google
```

User sẽ được redirect đến Google để đăng nhập. Sau khi đăng nhập thành công, Google sẽ redirect về callback URL và backend sẽ tự động tạo/find user, sau đó redirect về frontend với JWT token.

**Setup Google OAuth:**
1. Tạo OAuth credentials tại [Google Cloud Console](https://console.cloud.google.com/)
2. Cập nhật `.env` với:
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
   FRONTEND_URL=http://localhost:3001
   ```
3. Xem chi tiết tại [docs/GOOGLE_OAUTH_SETUP.md](docs/GOOGLE_OAUTH_SETUP.md)

**Frontend Integration:**

```typescript
// Redirect user to Google OAuth
window.location.href = 'http://localhost:3000/api/auth/google';

// Handle callback (trong callback page)
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
if (token) {
  localStorage.setItem('access_token', token);
  // Redirect to dashboard
}
```

#### Lấy profile (cần authentication)

```typescript
GET /api/auth/profile
Authorization: Bearer YOUR_TOKEN
```

### 3. User Module

Tất cả endpoints cần JWT authentication:

```typescript
// Lấy danh sách users
GET /api/users

// Lấy profile của user hiện tại
GET /api/users/profile

// Lấy thông tin user theo ID
GET /api/users/:id

// Tạo user mới
POST /api/users
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "user" // optional: "user" | "admin"
}

// Cập nhật user
PATCH /api/users/:id
{
  "firstName": "Updated Name",
  "isActive": true
}

// Xóa user
DELETE /api/users/:id
```

### 4. Admin Module

Tất cả endpoints yêu cầu role `admin`:

#### Dashboard

```typescript
GET /api/admin/dashboard
Authorization: Bearer YOUR_ADMIN_TOKEN
```

#### User Management

```typescript
// Lấy tất cả users
GET /api/admin/users

// Lấy user theo ID
GET /api/admin/users/:id

// Tạo user
POST /api/admin/users
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user"
}

// Cập nhật user
PATCH /api/admin/users/:id
{
  "firstName": "Updated",
  "isActive": true
}

// Xóa user
DELETE /api/admin/users/:id

// Kích hoạt user
PATCH /api/admin/users/:id/activate

// Vô hiệu hóa user
PATCH /api/admin/users/:id/deactivate
```

#### Settings

```typescript
// Lấy settings
GET /api/admin/settings

// Cập nhật settings
PUT /api/admin/settings
{
  "appName": "My App",
  "version": "1.0.0"
}
```

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | No | Đăng ký user mới |
| POST | `/api/auth/login` | No | Đăng nhập (Email/Password) |
| GET | `/api/auth/google` | No | Bắt đầu Google OAuth flow |
| GET | `/api/auth/google/callback` | No | Callback từ Google OAuth |
| GET | `/api/auth/profile` | Yes | Lấy profile |

### Users

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/users` | Yes | Lấy danh sách users |
| GET | `/api/users/profile` | Yes | Profile của user hiện tại |
| GET | `/api/users/:id` | Yes | Lấy user theo ID |
| POST | `/api/users` | Yes | Tạo user mới |
| PATCH | `/api/users/:id` | Yes | Cập nhật user |
| DELETE | `/api/users/:id` | Yes | Xóa user |

### Admin

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| GET | `/api/admin/dashboard` | Yes | Admin | Dashboard thống kê |
| GET | `/api/admin/users` | Yes | Admin | Quản lý users |
| GET | `/api/admin/users/:id` | Yes | Admin | Chi tiết user |
| POST | `/api/admin/users` | Yes | Admin | Tạo user |
| PATCH | `/api/admin/users/:id` | Yes | Admin | Cập nhật user |
| DELETE | `/api/admin/users/:id` | Yes | Admin | Xóa user |
| PATCH | `/api/admin/users/:id/activate` | Yes | Admin | Kích hoạt user |
| PATCH | `/api/admin/users/:id/deactivate` | Yes | Admin | Vô hiệu hóa user |
| GET | `/api/admin/settings` | Yes | Admin | Lấy settings |
| PUT | `/api/admin/settings` | Yes | Admin | Cập nhật settings |

### Queue

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| GET | `/api/queue/stats` | Yes | Admin | Thống kê tất cả queues |
| GET | `/api/queue/stats/:queueName` | Yes | Admin | Thống kê queue cụ thể |
| POST | `/api/queue/email` | Yes | Admin | Thêm email job |
| POST | `/api/queue/notification` | Yes | Admin | Thêm notification job |
| DELETE | `/api/queue/clean/:queueName` | Yes | Admin | Dọn dẹp queue |

## 🐳 Docker Commands

```bash
# Build và chạy containers
docker-compose up -d

# Xem logs
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f pgadmin

# Dừng containers
docker-compose down

# Dừng và xóa volumes (xóa data)
docker-compose down -v

# Rebuild containers
docker-compose up -d --build

# Restart một service cụ thể
docker-compose restart app

# Xem status
docker-compose ps

# Vào container
docker-compose exec app sh
docker-compose exec postgres psql -U postgres -d nestjs_db
docker-compose exec redis redis-cli

# Truy cập pgAdmin
# Mở trình duyệt: http://localhost:5050
# Email: admin@admin.com (hoặc giá trị trong PGADMIN_EMAIL)
# Password: admin (hoặc giá trị trong PGADMIN_PASSWORD)
```

## 💻 Development

### Scripts có sẵn

```bash
# Development
npm run start:dev          # Chạy với watch mode

# Production
npm run build              # Build project
npm run start:prod         # Chạy production

# Database Seeding
npm run seed               # Seed dữ liệu mẫu
npm run seed:clear         # Xóa dữ liệu đã seed
npm run seed:refresh       # Clear và seed lại

# Code quality
npm run lint               # Lint code
npm run format             # Format code với Prettier

# Testing
npm run test               # Chạy unit tests
npm run test:watch         # Chạy tests với watch mode
npm run test:cov           # Chạy tests với coverage
npm run test:e2e           # Chạy E2E tests
```

### Cấu trúc Guards và Decorators

#### Sử dụng Guards

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { Roles } from './common/decorators/roles.decorator';

@Controller('example')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ExampleController {
  // ...
}
```

#### Sử dụng CurrentUser Decorator

```typescript
import { CurrentUser } from './common/decorators/current-user.decorator';
import { User } from './user/entities/user.entity';

@Get('profile')
getProfile(@CurrentUser() user: User) {
  return user;
}
```

## 🔒 Security Notes

1. **JWT Secret:** Luôn thay đổi `JWT_SECRET` trong production
2. **Database Password:** Sử dụng password mạnh cho database
3. **Environment Variables:** Không commit file `.env` lên git
4. **HTTPS:** Sử dụng HTTPS trong production
5. **Rate Limiting:** Cân nhắc thêm rate limiting cho API

## 📝 Notes

- Database sẽ tự động được tạo khi chạy lần đầu (với `synchronize: true` trong development)
- Redis được sử dụng cho queue system và có thể dùng cho caching
- Tất cả passwords được hash bằng bcrypt
- JWT tokens có thời hạn mặc định là 7 ngày
- Logger sử dụng Pino với correlation ID để trace requests
- Tất cả requests được log tự động với correlation ID trong header `x-correlation-id`

## 📚 Documentation

- [API Response Format](./docs/API_RESPONSE_FORMAT.md) - Chuẩn hóa API response và error
- [Google OAuth Setup](./docs/GOOGLE_OAUTH_SETUP.md) - Hướng dẫn setup Google OAuth
- [Queue Guide](./docs/QUEUE_GUIDE.md) - Hướng dẫn sử dụng Queue System
- [Seeder Guide](./docs/SEEDER_GUIDE.md) - Hướng dẫn sử dụng Data Seeder
- [Logger Guide](./docs/LOGGER_GUIDE.md) - Hướng dẫn sử dụng Logger với Pino
- [TypeORM Guide](./docs/TYPEORM_GUIDE.md) - Hướng dẫn sử dụng TypeORM và Migrations
- [Cache Guide](./docs/CACHE_GUIDE.md) - Hướng dẫn sử dụng Cache Module với Redis
- [Scheduler Guide](./docs/SCHEDULER_GUIDE.md) - Hướng dẫn sử dụng Scheduler Module với Cron Jobs
- [Mail Guide](./docs/MAIL_GUIDE.md) - Hướng dẫn sử dụng Mail Module với Nodemailer
- [Storage Guide](./docs/STORAGE_GUIDE.md) - Hướng dẫn sử dụng Storage Module với Local Storage
- [Health Guide](./docs/HEALTH_GUIDE.md) - Hướng dẫn sử dụng Health Module với Terminus
- [Security Guide](./docs/SECURITY_GUIDE.md) - Hướng dẫn sử dụng Security Module (CORS, Helmet, Rate Limiting)
- [pgAdmin Guide](./docs/PGADMIN_GUIDE.md) - Hướng dẫn sử dụng pgAdmin

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
