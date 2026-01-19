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
- ✅ **Docker Support** - Full Docker setup với docker-compose
- ✅ **Validation** - Request validation với class-validator
- ✅ **Error Handling** - Global exception filters
- ✅ **Response Transformation** - Global interceptors

## 📁 Cấu trúc dự án

```
src/
├── common/                    # Common utilities
│   ├── decorators/            # Custom decorators (@CurrentUser, @Roles)
│   ├── filters/               # Exception filters
│   ├── guards/                # Auth guards (JWT, Roles)
│   └── interceptors/          # Response interceptors
├── config/                    # Configuration files
├── database/                   # Database configuration (TypeORM)
├── auth/                       # Authentication module
│   ├── dto/                   # Data Transfer Objects
│   ├── guards/                # Auth guards
│   └── strategies/            # Passport strategies (JWT, Local)
├── user/                       # User module
│   ├── dto/                   # User DTOs
│   ├── entities/              # User entity
│   ├── user.controller.ts     # User endpoints
│   ├── user.service.ts        # User business logic
│   └── user.module.ts         # User module
├── admin/                      # Admin module
│   ├── users/                 # Admin user management
│   ├── settings/              # Admin settings
│   └── dashboard/             # Admin dashboard
├── queue/                      # Queue module
│   ├── queue.module.ts        # Queue configuration
│   ├── queue.service.ts       # Queue service
│   ├── queue.processor.ts     # Job processors
│   └── queue.controller.ts    # Queue API endpoints
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

# Application Configuration
APP_PORT=3000
NODE_ENV=development
```

**⚠️ Lưu ý:** Trước khi deploy production, hãy thay đổi `JWT_SECRET` và `DB_PASSWORD` thành các giá trị mạnh và bảo mật.

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

### 3. Sử dụng Token

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

#### Đăng nhập

```typescript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
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
| POST | `/api/auth/login` | No | Đăng nhập |
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
```

## 💻 Development

### Scripts có sẵn

```bash
# Development
npm run start:dev          # Chạy với watch mode

# Production
npm run build              # Build project
npm run start:prod         # Chạy production

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

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
