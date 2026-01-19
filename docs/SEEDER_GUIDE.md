# Hướng dẫn Seeder Dữ liệu Mẫu

## Tổng quan

Seeder system cho phép bạn tạo dữ liệu mẫu vào database một cách dễ dàng. Hệ thống seeder được thiết kế để:
- Tạo dữ liệu mẫu cho development và testing
- Tránh duplicate data (kiểm tra trước khi tạo)
- Dễ dàng clear và refresh data
- Hỗ trợ seeding từng loại data riêng biệt

## Cấu trúc

```
src/database/seeder/
├── seeder.module.ts      # Seeder module
├── seeder.service.ts      # Seeder service với logic seeding
└── seeder.command.ts      # CLI command để chạy seeder
```

## Dữ liệu Mẫu

### Users

Seeder sẽ tạo các users mẫu sau:

| Email | Password | Role | Status | Mô tả |
|-------|----------|------|--------|-------|
| admin@example.com | admin123 | admin | Active | Admin user để test admin features |
| user@example.com | user123 | user | Active | Regular user mẫu |
| jane@example.com | user123 | user | Active | Regular user mẫu thứ 2 |
| inactive@example.com | user123 | user | Inactive | User không active để test |

## Cài đặt

### 1. Cài đặt Dependencies

Dependencies đã được thêm vào `package.json`:
- `commander` - CLI command framework
- `ts-node` - Chạy TypeScript trực tiếp (đã có sẵn)

### 2. Đảm bảo Database đã sẵn sàng

```bash
# Nếu dùng Docker
docker-compose up -d postgres

# Hoặc đảm bảo PostgreSQL đang chạy và database đã được tạo
```

## Sử dụng

### Chạy Seeder

#### 1. Seed dữ liệu mẫu

```bash
npm run seed
```

Lệnh này sẽ:
- Kiểm tra xem user đã tồn tại chưa
- Chỉ tạo user mới nếu chưa tồn tại
- Log quá trình seeding

**Output:**
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

#### 2. Clear dữ liệu đã seed

```bash
npm run seed:clear
```

Lệnh này sẽ xóa tất cả users trong database.

**⚠️ Cảnh báo:** Lệnh này sẽ xóa TẤT CẢ users, không chỉ dữ liệu mẫu!

#### 3. Refresh (Clear + Seed)

```bash
npm run seed:refresh
```

Lệnh này sẽ:
1. Xóa tất cả users
2. Seed lại dữ liệu mẫu

**Output:**
```
[Nest] Refreshing database (clear + seed)...
[Nest] Clearing database...
[Nest] Database cleared successfully!
[Nest] Starting database seeding...
[Nest] Seeding users...
[Nest] Created user: admin@example.com
...
[Nest] Database seeding completed successfully!
```

## Sử dụng trong Code

### Import SeederService

```typescript
import { SeederService } from './database/seeder/seeder.service';
import { SeederModule } from './database/seeder/seeder.module';

// Trong module
@Module({
  imports: [SeederModule],
  // ...
})
```

### Chạy Seeder Programmatically

```typescript
import { SeederService } from './database/seeder/seeder.service';

// Trong service hoặc controller
constructor(private seederService: SeederService) {}

async seedData() {
  await this.seederService.seed();
}

async clearData() {
  await this.seederService.clear();
}

async refreshData() {
  await this.seederService.refresh();
}
```

## Tùy chỉnh Seeder

### Thêm User Mới

Chỉnh sửa file `src/database/seeder/seeder.service.ts`:

```typescript
async seedUsers() {
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

### Thêm Seeder Mới (ví dụ: Products, Orders, etc.)

1. Tạo entity mới (nếu chưa có)
2. Thêm repository vào SeederModule
3. Thêm method seeding mới vào SeederService:

```typescript
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

## Best Practices

### 1. Idempotent Seeding

Seeder được thiết kế để có thể chạy nhiều lần mà không tạo duplicate:
- Luôn kiểm tra data đã tồn tại trước khi tạo
- Skip nếu đã tồn tại

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

- Passwords được hash bằng bcrypt
- Sử dụng passwords mạnh trong production
- Không commit passwords thật vào code

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

## Troubleshooting

### Lỗi: "Cannot find module 'commander'"

```bash
npm install
```

### Lỗi: "Database connection failed"

- Kiểm tra database đang chạy
- Kiểm tra `.env` file với đúng thông tin database
- Đảm bảo database đã được tạo

### Lỗi: "Table 'users' doesn't exist"

- Chạy migration hoặc đảm bảo `synchronize: true` trong development
- Database sẽ tự động tạo tables khi chạy app lần đầu

### Seeder chạy nhưng không tạo data

- Kiểm tra logs để xem có lỗi gì không
- Kiểm tra xem data đã tồn tại chưa (seeder sẽ skip nếu đã tồn tại)
- Chạy `seed:refresh` để clear và seed lại

## Scripts có sẵn

| Script | Mô tả |
|--------|-------|
| `npm run seed` | Seed dữ liệu mẫu |
| `npm run seed:clear` | Xóa tất cả dữ liệu đã seed |
| `npm run seed:refresh` | Clear và seed lại |

## Ví dụ Workflow

### Development Setup

```bash
# 1. Start database
docker-compose up -d postgres

# 2. Seed initial data
npm run seed

# 3. Start application
npm run start:dev
```

### Reset Database

```bash
# Clear và seed lại
npm run seed:refresh
```

### Testing

```bash
# Trước khi chạy tests
npm run seed

# Chạy tests
npm run test

# Sau khi tests (optional)
npm run seed:clear
```

## Security Notes

1. **Không seed trong Production** - Chỉ sử dụng seeder trong development và testing
2. **Passwords mẫu** - Đảm bảo đổi passwords sau khi seed trong production
3. **Sensitive Data** - Không seed sensitive data thật (credit cards, SSN, etc.)
4. **Environment Variables** - Sử dụng environment variables cho data có thể thay đổi

## Mở rộng

### Thêm CLI Options

Có thể mở rộng seeder command với các options:

```typescript
program
  .command('seed')
  .option('-u, --users', 'Seed only users')
  .option('-p, --products', 'Seed only products')
  .action(async (options) => {
    if (options.users) {
      await seederService.seedUsers();
    } else if (options.products) {
      await seederService.seedProducts();
    } else {
      await seederService.seed();
    }
  });
```

### Thêm Faker Data

Có thể sử dụng thư viện như `@faker-js/faker` để tạo data ngẫu nhiên:

```bash
npm install @faker-js/faker
```

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

## Tài liệu liên quan

- [TypeORM Documentation](https://typeorm.io/)
- [NestJS CLI](https://docs.nestjs.com/cli/overview)
- [Database Module](./README.md#database)
