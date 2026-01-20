# Hướng dẫn Refactoring Cấu trúc Dự án

## Tổng quan

Dự án đã được cấu trúc lại theo kiến trúc mới với các thư mục:
- `config/` - Configuration files
- `common/` - Common utilities (decorators, filters, guards, interceptors)
- `infrastructure/` - Infrastructure layer (database, queue, cache, etc.)
- `modules/` - Business modules (auth, users, admin)
- `shared/` - Shared DTOs, errors, pagination

## Cấu trúc mới

```
src/
  main.ts
  app.module.ts

  config/
    configuration.ts      ✅ Đã tạo
    validation.ts         ✅ Đã tạo

  common/
    constants/            📁 Cần tạo
    decorators/          ✅ Đã tạo (current-user, roles)
    filters/             ✅ Đã tạo (http-exception, all-exceptions)
    guards/              ✅ Đã tạo (jwt-auth, roles)
    interceptors/        ✅ Đã tạo (transform)
    pipes/               📁 Cần tạo
    utils/                📁 Cần tạo
    types/                📁 Cần tạo

  infrastructure/
    database/
      database.module.ts  ✅ Đã tạo
      orm.config.ts       📁 Cần tạo
      migrations/         📁 Cần tạo
      seed/               📁 Cần di chuyển từ database/seeder/
    cache/                📁 Cần tạo
    queue/                📁 Cần di chuyển từ queue/
    mail/                 📁 Cần tạo
    storage/              📁 Cần tạo
    logger/               📁 Cần tạo
    health/               📁 Cần tạo

  modules/
    auth/
      auth.module.ts      📁 Cần di chuyển từ auth/
      controllers/        📁 Cần di chuyển
      services/           📁 Cần di chuyển
      strategies/         📁 Cần di chuyển
      guards/             📁 Cần di chuyển
      dtos/               📁 Cần di chuyển
      entities/           📁 Cần tạo nếu có
    users/
      users.module.ts     📁 Cần di chuyển từ user/
      controllers/        📁 Cần di chuyển
      services/           📁 Cần di chuyển
      repositories/       📁 Cần tạo
      dtos/               📁 Cần di chuyển
      entities/           📁 Cần di chuyển
      mappers/            📁 Cần tạo
    admin/
      admin.module.ts     📁 Cần di chuyển từ admin/
      controllers/        📁 Cần di chuyển
      services/           📁 Cần di chuyển
      dtos/               📁 Cần tạo nếu cần

  shared/
    pagination/           ✅ Đã tạo (pagination.dto.ts)
    response/             ✅ Đã tạo (api-response.dto.ts, response.helper.ts)
    errors/               ✅ Đã tạo (custom-exceptions.ts)
```

## Các bước Migration

### Bước 1: Di chuyển Infrastructure

```bash
# Di chuyển database
mv src/database/seeder src/infrastructure/database/seed

# Di chuyển queue
mv src/queue src/infrastructure/queue
```

### Bước 2: Di chuyển Modules

```bash
# Di chuyển auth
mv src/auth/* src/modules/auth/
mkdir -p src/modules/auth/{controllers,services,strategies,guards,dtos,entities}
# Di chuyển files vào đúng thư mục

# Di chuyển users
mv src/user/* src/modules/users/
mkdir -p src/modules/users/{controllers,services,repositories,dtos,entities,mappers}
# Di chuyển files vào đúng thư mục

# Di chuyển admin
mv src/admin/* src/modules/admin/
mkdir -p src/modules/admin/{controllers,services,dtos}
# Di chuyển files vào đúng thư mục
```

### Bước 3: Cập nhật Imports

Cần cập nhật imports trong tất cả các file:

#### Old imports → New imports

```typescript
// Old
import { User } from '../user/entities/user.entity';
import { QueueService } from '../queue/queue.service';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { NotFoundException } from '../common/exceptions/custom-exceptions';

// New
import { User } from '../modules/users/entities/user.entity';
import { QueueService } from '../infrastructure/queue/queue.service';
import { ApiResponseDto } from '../shared/response/api-response.dto';
import { NotFoundException } from '../shared/errors/custom-exceptions';
```

### Bước 4: Cập nhật app.module.ts

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig, { databaseConfig, redisConfig, jwtConfig, googleOAuthConfig } from './config/configuration';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { SeederModule } from './infrastructure/database/seed/seeder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, databaseConfig, redisConfig, jwtConfig, googleOAuthConfig],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    AdminModule,
    QueueModule,
    SeederModule,
  ],
})
export class AppModule {}
```

## Checklist Migration

- [x] Tạo cấu trúc thư mục mới
- [x] Tạo config files
- [x] Tạo shared files (response, errors, pagination)
- [x] Cập nhật common files (decorators, filters, guards, interceptors)
- [x] Cập nhật main.ts
- [ ] Di chuyển infrastructure files
- [ ] Di chuyển modules files
- [ ] Cập nhật tất cả imports
- [ ] Cập nhật app.module.ts
- [ ] Test và fix lỗi
- [ ] Xóa các file/thư mục cũ

## Lưu ý

1. **Backup trước khi migration**: Đảm bảo đã commit hoặc backup code hiện tại
2. **Test từng bước**: Test sau mỗi bước migration
3. **Cập nhật imports**: Sử dụng IDE để find/replace imports
4. **Xóa file cũ**: Chỉ xóa sau khi đã test thành công

## Script hỗ trợ

Có thể sử dụng script để tìm và thay thế imports:

```bash
# Tìm tất cả imports cần thay đổi
grep -r "from '../user/" src/
grep -r "from '../queue/" src/
grep -r "from '../common/dto/" src/
```

Sau đó thay thế bằng imports mới.
