# Hướng dẫn Seeder Dữ liệu Mẫu

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Quick Start](#quick-start)
- [Dữ liệu Mẫu](#dữ-liệu-mẫu)
- [Sử dụng với Docker](#sử-dụng-với-docker)
- [Sử dụng Local (không Docker)](#sử-dụng-local-không-docker)
- [Các Lệnh Seeder](#các-lệnh-seeder)
- [Tùy chỉnh Seeder](#tùy-chỉnh-seeder)
- [Troubleshooting](#troubleshooting)

## 🎯 Tổng quan

Seeder system cho phép bạn tạo dữ liệu mẫu vào database một cách dễ dàng. Hệ thống seeder được thiết kế để:

- ✅ Tạo dữ liệu mẫu cho development và testing
- ✅ Tránh duplicate data (kiểm tra trước khi tạo)
- ✅ Dễ dàng clear và refresh data
- ✅ Hỗ trợ seeding từng loại data riêng biệt

## 🚀 Quick Start

### Với Docker (Khuyến nghị)

```bash
# 1. Đảm bảo containers đang chạy
docker compose ps

# 2. Chạy seed
docker compose exec app npm run seed
```

### Không dùng Docker

```bash
# 1. Đảm bảo database đang chạy
# 2. Chạy seed
npm run seed
```

## 📊 Dữ liệu Mẫu

Seeder sẽ tạo các users mẫu sau:

| Email                  | Password   | Role  | Status   | Mô tả                                       |
| ---------------------- | ---------- | ----- | -------- | ------------------------------------------- |
| `admin@example.com`    | `admin123` | admin | Active   | Admin user để test admin features           |
| `user@example.com`     | `user123`  | user  | Active   | Regular user mẫu                            |
| `jane@example.com`     | `user123`  | user  | Active   | Regular user mẫu thứ 2                      |
| `inactive@example.com` | `user123`  | user  | Inactive | User không active để test inactive features |

**Lưu ý:** Seeder sẽ **không tạo duplicate** - nếu user đã tồn tại, nó sẽ bỏ qua.

## 🐳 Sử dụng với Docker

### Bước 1: Kiểm tra containers đang chạy

```bash
docker compose ps
```

Bạn sẽ thấy các containers:

- `nestjs_app` - Container ứng dụng
- `nestjs_postgres` - Container database
- `nestjs_redis` - Container Redis
- `nestjs_pgadmin` - Container pgAdmin

### Bước 2: Chạy seed

```bash
# Chạy seed dữ liệu mẫu
docker compose exec app npm run seed
```

**Output mẫu:**

```
[Nest] Starting database seeding...
[Nest] Seeding users...
[Nest] Created user: admin@example.com
[Nest] Created user: user@example.com
[Nest] Created user: jane@example.com
[Nest] Created user: inactive@example.com
[Nest] Users seeding completed!
[Nest] Database seeding completed successfully!
```

### Bước 3: Xác nhận dữ liệu đã được tạo

Bạn có thể kiểm tra qua:

- **pgAdmin:** Truy cập `http://localhost:5050` và xem table `users`
- **API:** Đăng nhập với các tài khoản trên

### Các lệnh khác

```bash
# Xóa tất cả users (⚠️ Cảnh báo: Xóa TẤT CẢ users)
docker compose exec app npm run seed:clear

# Xóa và seed lại
docker compose exec app npm run seed:refresh

# Vào container để chạy lệnh khác
docker compose exec app sh
```

## 💻 Sử dụng Local (không Docker)

### Yêu cầu

- PostgreSQL đang chạy
- Database đã được tạo
- File `.env` đã được cấu hình đúng

### Chạy seed

```bash
# 1. Cài đặt dependencies (nếu chưa có)
npm install

# 2. Chạy seed
npm run seed
```

### Các lệnh khác

```bash
# Xóa dữ liệu
npm run seed:clear

# Refresh (xóa + seed lại)
npm run seed:refresh
```

## 📝 Các Lệnh Seeder

### 1. `npm run seed` - Seed dữ liệu mẫu

**Mô tả:** Tạo dữ liệu mẫu vào database. Nếu dữ liệu đã tồn tại, sẽ bỏ qua.

**Sử dụng:**

```bash
# Docker
docker compose exec app npm run seed

# Local
npm run seed
```

**Khi nào sử dụng:**

- Lần đầu setup project
- Cần thêm dữ liệu mẫu mới
- Sau khi clear database

### 2. `npm run seed:clear` - Xóa dữ liệu

**Mô tả:** Xóa TẤT CẢ users trong database.

**⚠️ Cảnh báo:** Lệnh này sẽ xóa TẤT CẢ users, không chỉ dữ liệu mẫu!

**Sử dụng:**

```bash
# Docker
docker compose exec app npm run seed:clear

# Local
npm run seed:clear
```

**Khi nào sử dụng:**

- Cần xóa toàn bộ dữ liệu
- Reset database về trạng thái ban đầu
- Trước khi seed lại

### 3. `npm run seed:refresh` - Refresh dữ liệu

**Mô tả:** Xóa tất cả users và seed lại dữ liệu mẫu.

**Sử dụng:**

```bash
# Docker
docker compose exec app npm run seed:refresh

# Local
npm run seed:refresh
```

**Khi nào sử dụng:**

- Cần reset database về trạng thái mẫu
- Sau khi test và muốn quay về dữ liệu ban đầu
- Khi có thay đổi trong seeder

## 🔧 Tùy chỉnh Seeder

### Cấu trúc Seeder

```
src/database/seeder/
├── seeder.module.ts      # Seeder module
├── seeder.service.ts      # Seeder service với logic seeding
└── seeder.command.ts      # CLI command để chạy seeder
```

### Thêm User Mới

Chỉnh sửa file `src/database/seeder/seeder.service.ts`:

```typescript
async seedUsers() {
  this.logger.log('Seeding users...');

  const users = [
    // ... existing users
    {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      role: UserRole.USER,
      isActive: true,
    },
  ];

  // ... rest of the code
}
```

### Thêm Seeder Mới (ví dụ: Products, Orders)

**Bước 1:** Tạo entity mới (nếu chưa có)

**Bước 2:** Thêm repository vào SeederModule

```typescript
// seeder.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Product]), // Thêm Product
  ],
  // ...
})
```

**Bước 3:** Thêm method seeding mới vào SeederService

```typescript
// seeder.service.ts
async seedProducts() {
  this.logger.log('Seeding products...');

  const products = [
    {
      name: 'Product 1',
      price: 100,
      // ... other fields
    },
    // ... more products
  ];

  for (const productData of products) {
    const existing = await this.productRepository.findOne({
      where: { name: productData.name },
    });

    if (existing) {
      this.logger.log(`Product ${productData.name} already exists, skipping...`);
      continue;
    }

    const product = this.productRepository.create(productData);
    await this.productRepository.save(product);
    this.logger.log(`Created product: ${productData.name}`);
  }

  this.logger.log('Products seeding completed!');
}

// Thêm vào method seed()
async seed() {
  this.logger.log('Starting database seeding...');

  try {
    await this.seedUsers();
    await this.seedProducts(); // Thêm dòng này
    this.logger.log('Database seeding completed successfully!');
  } catch (error) {
    this.logger.error('Error seeding database:', error);
    throw error;
  }
}
```

### Sử dụng Faker để tạo dữ liệu ngẫu nhiên

**Cài đặt:**

```bash
npm install @faker-js/faker
```

**Sử dụng:**

```typescript
import { faker } from '@faker-js/faker';

async seedUsers(count: number = 10) {
  for (let i = 0; i < count; i++) {
    const user = {
      email: faker.internet.email(),
      password: 'password123',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: UserRole.USER,
      isActive: true,
    };
    // ... create user
  }
}
```

## 🐛 Troubleshooting

### Lỗi: "Cannot find module 'commander'"

**Nguyên nhân:** Dependencies chưa được cài đặt.

**Giải pháp:**

```bash
# Docker
docker compose exec app npm install

# Local
npm install
```

### Lỗi: "Database connection failed"

**Nguyên nhân:** Database không kết nối được.

**Giải pháp:**

1. **Kiểm tra database đang chạy:**

   ```bash
   # Docker
   docker compose ps postgres

   # Local
   # Kiểm tra PostgreSQL service đang chạy
   ```

2. **Kiểm tra file `.env`:**

   ```env
   DB_HOST=postgres  # hoặc localhost nếu không dùng Docker
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=nestjs_db
   ```

3. **Kiểm tra network (Docker):**
   ```bash
   docker compose exec app ping postgres
   ```

### Lỗi: "Table 'users' doesn't exist"

**Nguyên nhân:** Database chưa có tables.

**Giải pháp:**

1. **Chạy ứng dụng lần đầu** để tạo tables tự động (với `synchronize: true` trong development)
2. **Hoặc chạy migrations** nếu có

### Seeder chạy nhưng không tạo data

**Nguyên nhân có thể:**

1. **Data đã tồn tại:** Seeder sẽ skip nếu user đã tồn tại
2. **Lỗi trong quá trình seeding:** Kiểm tra logs

**Giải pháp:**

```bash
# Xem logs chi tiết
docker compose logs app | grep -i seed

# Clear và seed lại
docker compose exec app npm run seed:refresh
```

### Lỗi: "Container not found" hoặc "Cannot connect to container"

**Giải pháp:**

```bash
# Kiểm tra containers đang chạy
docker compose ps

# Nếu container không chạy, khởi động lại
docker compose up -d

# Sau đó chạy seed
docker compose exec app npm run seed
```

## 💡 Best Practices

### 1. Idempotent Seeding

Seeder được thiết kế để có thể chạy nhiều lần mà không tạo duplicate:

- ✅ Luôn kiểm tra data đã tồn tại trước khi tạo
- ✅ Skip nếu đã tồn tại
- ✅ Log rõ ràng quá trình seeding

### 2. Environment-specific Data

Có thể tùy chỉnh seeder theo environment:

```typescript
async seedUsers() {
  const users = [
    // Base users
    { email: 'admin@example.com', ... },
  ];

  // Thêm users cho development
  if (process.env.NODE_ENV === 'development') {
    users.push(
      { email: 'dev@example.com', ... },
    );
  }

  // ... rest of the code
}
```

### 3. Password Security

- ✅ Passwords được hash bằng bcrypt
- ✅ Sử dụng passwords mạnh trong production
- ❌ Không commit passwords thật vào code

### 4. Seeding trong Tests

Có thể sử dụng seeder trong tests:

```typescript
describe('UserService', () => {
  let seederService: SeederService;

  beforeAll(async () => {
    // Setup test database
    await seederService.seed();
  });

  afterAll(async () => {
    await seederService.clear();
  });
});
```

## 🔒 Security Notes

1. **❌ Không seed trong Production** - Chỉ sử dụng seeder trong development và testing
2. **⚠️ Passwords mẫu** - Đảm bảo đổi passwords sau khi seed trong production
3. **❌ Sensitive Data** - Không seed sensitive data thật (credit cards, SSN, etc.)
4. **✅ Environment Variables** - Sử dụng environment variables cho data có thể thay đổi

## 📚 Ví dụ Workflow

### Development Setup

```bash
# 1. Start containers
docker compose up -d

# 2. Đợi database sẵn sàng (vài giây)
sleep 5

# 3. Seed initial data
docker compose exec app npm run seed

# 4. Kiểm tra ứng dụng
curl http://localhost:3000/api
```

### Reset Database

```bash
# Clear và seed lại
docker compose exec app npm run seed:refresh
```

### Testing Workflow

```bash
# Trước khi chạy tests
docker compose exec app npm run seed

# Chạy tests
docker compose exec app npm run test

# Sau khi tests (optional)
docker compose exec app npm run seed:clear
```

## 📖 Tài liệu liên quan

- [TypeORM Documentation](https://typeorm.io/)
- [NestJS CLI](https://docs.nestjs.com/cli/overview)
- [pgAdmin Guide](./PGADMIN_GUIDE.md) - Xem dữ liệu qua pgAdmin
- [README.md](../README.md) - Tài liệu chính của project
