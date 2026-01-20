# Đề xuất Cải thiện Cấu trúc Dự án NestJS

## 📋 Tổng quan

Sau khi kiểm tra cấu trúc dự án, đây là các đề xuất cải thiện để làm cho dự án tốt hơn, dễ bảo trì và mở rộng hơn.

## ✅ Điểm Mạnh Hiện Tại

1. ✅ Cấu trúc rõ ràng với separation of concerns
2. ✅ Infrastructure layer được tách biệt tốt
3. ✅ Common utilities được tổ chức tốt
4. ✅ Constants được quản lý tập trung
5. ✅ Error handling và response transformation đã được chuẩn hóa
6. ✅ Security, Health checks, Logging đã được tích hợp

## 🔧 Đề xuất Cải thiện

### 1. ✅ **COMPLETED: Environment Validation**

**Vấn đề:** Chưa có validation schema cho environment variables.

**Giải pháp:** ✅ Đã tạo validation schema với `joi`.

**Priority:** 🔴 HIGH

**Status:** ✅ **COMPLETED**

**Files Created:**
- `src/config/validation.schema.ts` - Validation schema với Joi
- `docs/ENV_VALIDATION_GUIDE.md` - Documentation

**Implementation:**
```typescript
// src/config/validation.schema.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  APP_PORT: Joi.number().default(3000),
  DB_HOST: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  // ... more validations
});

// src/app.module.ts
ConfigModule.forRoot({
  validationSchema,
  validationOptions,
})
```

**Required Variables:**
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET` (minimum 32 characters)

**Documentation:** Xem [ENV_VALIDATION_GUIDE.md](./ENV_VALIDATION_GUIDE.md)

### 2. ✅ **COMPLETED: Repositories Pattern**

**Vấn đề:** Thư mục `repositories/` trống, services đang inject repository trực tiếp.

**Giải pháp:** ✅ Đã tạo custom repositories với Base Repository.

**Priority:** 🟡 MEDIUM

**Status:** ✅ **COMPLETED**

**Files Created:**
- `src/common/repositories/base.repository.ts` - Base repository với common methods
- `src/modules/users/repositories/users.repository.ts` - Custom Users repository
- `docs/REPOSITORY_PATTERN_GUIDE.md` - Documentation

**Implementation:**
```typescript
// src/common/repositories/base.repository.ts
export abstract class BaseRepository<T> extends Repository<T> {
  async findById(id: string): Promise<T>
  async findByIdOrNull(id: string): Promise<T | null>
  async exists(id: string): Promise<boolean>
  async findActive(): Promise<T[]>
  async findInactive(): Promise<T[]>
}

// src/modules/users/repositories/users.repository.ts
@Injectable()
export class UsersRepository extends BaseRepository<User> {
  async findByEmail(email: string): Promise<User | null>
  async findByEmailWithPassword(email: string): Promise<User | null>
  async findActiveUsers(): Promise<User[]>
  async findByRole(role: string): Promise<User[]>
  async emailExists(email: string): Promise<boolean>
}
```

**Benefits:**
- ✅ Tách biệt data access logic khỏi business logic
- ✅ Tái sử dụng code với common methods
- ✅ Dễ test với mock repositories
- ✅ Type safety với TypeScript

**Documentation:** Xem [REPOSITORY_PATTERN_GUIDE.md](./REPOSITORY_PATTERN_GUIDE.md)

### 3. ✅ **COMPLETED: Mappers Pattern**

**Vấn đề:** Thư mục `mappers/` trống, không có layer chuyển đổi Entity ↔ DTO.

**Giải pháp:** ✅ Đã tạo mappers với Base Mapper.

**Priority:** 🟡 MEDIUM

**Status:** ✅ **COMPLETED**

**Files Created:**
- `src/common/mappers/base.mapper.ts` - Base mapper với common methods
- `src/modules/users/mappers/user.mapper.ts` - Custom User mapper
- `src/modules/users/dtos/user.dto.ts` - User DTO for response
- `docs/MAPPER_PATTERN_GUIDE.md` - Documentation

**Implementation:**
```typescript
// src/common/mappers/base.mapper.ts
export abstract class BaseMapper<TEntity, TDto> {
  abstract toDto(entity: TEntity): TDto;
  abstract toEntity(dto: Partial<TDto>): Partial<TEntity>;
  toDtoArray(entities: TEntity[]): TDto[];
  toEntityArray(dtos: Partial<TDto>[]): Partial<TEntity>[];
}

// src/modules/users/mappers/user.mapper.ts
export class UserMapper extends BaseMapper<User, UserDto> {
  toDto(user: User): UserDto // Excludes password
  toEntity(dto: Partial<CreateUserDto>): Partial<User>
  toEntityFromUpdate(dto: Partial<UpdateUserDto>): Partial<User>
}
```

**Benefits:**
- ✅ Tách biệt Entity và DTO
- ✅ Bảo mật - Loại bỏ sensitive data (password)
- ✅ Flexibility - Dễ thay đổi response format
- ✅ Type safety với TypeScript

**Documentation:** Xem [MAPPER_PATTERN_GUIDE.md](./MAPPER_PATTERN_GUIDE.md)

### 4. 🏗️ **Base Entity**

**Vấn đề:** Mỗi entity phải tự định nghĩa common fields (id, createdAt, updatedAt).

**Giải pháp:** Tạo base entity với common fields.

**Priority:** 🟢 LOW

```typescript
// src/shared/entities/base.entity.ts
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 5. 🔧 **Custom Pipes**

**Vấn đề:** Thư mục `pipes/` trống, chưa có custom pipes.

**Giải pháp:** Tạo custom pipes cho validation và transformation.

**Priority:** 🟢 LOW

```typescript
// src/common/pipes/parse-int.pipe.ts
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed');
    }
    return val;
  }
}
```

### 6. 📝 **TypeScript Types**

**Vấn đề:** Thư mục `types/` trống, chưa có shared types/interfaces.

**Giải pháp:** Tạo shared types cho common interfaces.

**Priority:** 🟢 LOW

```typescript
// src/common/types/index.ts
export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
```

### 7. 🧪 **Testing Setup**

**Vấn đề:** Chưa có test files và testing configuration.

**Giải pháp:** Setup testing với Jest và tạo test examples.

**Priority:** 🟡 MEDIUM

```typescript
// src/modules/users/services/users.service.spec.ts
describe('UsersService', () => {
  let service: UsersService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService, /* mocks */],
    }).compile();
    
    service = module.get<UsersService>(UsersService);
  });
  
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### 8. 📚 **API Versioning**

**Vấn đề:** Chưa có API versioning strategy.

**Giải pháp:** Implement API versioning với `@nestjs/common`.

**Priority:** 🟢 LOW

```typescript
// main.ts
app.setGlobalPrefix('api/v1');
```

### 9. 🔐 **Base Service với Common CRUD**

**Vấn đề:** Services có code lặp lại cho CRUD operations.

**Giải pháp:** Tạo base service với common CRUD methods.

**Priority:** 🟡 MEDIUM

```typescript
// src/common/services/base.service.ts
export abstract class BaseService<T> {
  constructor(protected repository: Repository<T>) {}
  
  async findAll(): Promise<T[]> {
    return this.repository.find();
  }
  
  async findOne(id: string): Promise<T> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException();
    }
    return entity;
  }
  // ... more common methods
}
```

### 10. 📊 **Base Repository**

**Vấn đề:** Repositories có thể có common methods.

**Giải pháp:** Tạo base repository với common query methods.

**Priority:** 🟢 LOW

```typescript
// src/common/repositories/base.repository.ts
export abstract class BaseRepository<T extends BaseEntity> extends Repository<T> {
  async findById(id: string): Promise<T | null> {
    return this.findOne({ where: { id } });
  }
  
  async softDelete(id: string): Promise<void> {
    await this.update(id, { deletedAt: new Date() });
  }
}
```

### 11. 🎯 **DTO Validation với Custom Decorators**

**Vấn đề:** Validation messages chưa được customize.

**Giải pháp:** Tạo custom validation decorators.

**Priority:** 🟢 LOW

```typescript
// src/common/decorators/is-strong-password.decorator.ts
export function IsStrongPassword() {
  return applyDecorators(
    IsString(),
    MinLength(8),
    Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: 'Password must contain uppercase, lowercase, and number',
    }),
  );
}
```

### 12. 📦 **Module Organization**

**Vấn đề:** Một số modules có thể được tổ chức tốt hơn.

**Giải pháp:** Đảm bảo mỗi module có structure nhất quán.

**Priority:** 🟢 LOW

```
modules/
  users/
    users.module.ts
    users.controller.ts
    users.service.ts
    users.repository.ts
    users.mapper.ts
    dtos/
    entities/
```

### 13. 🔄 **Transform Interceptor Improvements**

**Vấn đề:** Transform interceptor có thể được cải thiện.

**Giải pháp:** Sử dụng constants cho default messages.

**Priority:** 🟢 LOW

```typescript
// Đã được cải thiện với SUCCESS_MESSAGES
const message = data?.message || SUCCESS_MESSAGES.SUCCESS;
```

### 14. 📝 **Documentation**

**Vấn đề:** Cần thêm documentation cho:
- Architecture decisions
- Code examples
- API contracts

**Giải pháp:** Tạo thêm documentation files.

**Priority:** 🟡 MEDIUM

## 🎯 Priority Summary

### 🔴 HIGH Priority
1. Environment Validation Schema

### 🟡 MEDIUM Priority
2. Repositories Pattern
3. Mappers Pattern
4. Testing Setup
5. Base Service với Common CRUD

### 🟢 LOW Priority
6. Base Entity
7. Custom Pipes
8. TypeScript Types
9. API Versioning
10. Base Repository
11. Custom Validation Decorators
12. Module Organization
13. Transform Interceptor Improvements
14. Documentation

## 📋 Implementation Plan

### Phase 1: Critical (Week 1)
- [ ] Environment Validation Schema
- [ ] Testing Setup

### Phase 2: Important (Week 2-3)
- [ ] Repositories Pattern
- [ ] Mappers Pattern
- [ ] Base Service

### Phase 3: Nice to Have (Week 4+)
- [ ] Base Entity
- [ ] Custom Pipes
- [ ] TypeScript Types
- [ ] API Versioning
- [ ] Base Repository
- [ ] Custom Validation Decorators

## 🔗 Tài liệu liên quan

- [NestJS Best Practices](https://docs.nestjs.com/)
- [Repository Pattern](https://docs.nestjs.com/techniques/database#repository-pattern)
- [Testing](https://docs.nestjs.com/fundamentals/testing)
