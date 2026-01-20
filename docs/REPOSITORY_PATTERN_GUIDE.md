# Hướng dẫn Repository Pattern

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Base Repository](#base-repository)
- [Custom Repositories](#custom-repositories)
- [Sử dụng trong Services](#sử-dụng-trong-services)
- [Best Practices](#best-practices)
- [Ví dụ](#ví-dụ)

## 🎯 Tổng quan

Repository Pattern giúp:

- ✅ **Tách biệt data access logic** khỏi business logic
- ✅ **Tái sử dụng code** với common methods
- ✅ **Dễ test** với mock repositories
- ✅ **Dễ maintain** khi thay đổi data access layer
- ✅ **Type safety** với TypeScript

## 🏗️ Base Repository

Base Repository cung cấp các methods chung cho tất cả repositories:

```typescript
// src/common/repositories/base.repository.ts
export abstract class BaseRepository<T> extends Repository<T> {
  // Find by ID, throw exception if not found
  async findById(id: string): Promise<T>
  
  // Find by ID, return null if not found
  async findByIdOrNull(id: string): Promise<T | null>
  
  // Check if entity exists
  async exists(id: string): Promise<boolean>
  
  // Find active entities
  async findActive(): Promise<T[]>
  
  // Find inactive entities
  async findInactive(): Promise<T[]>
}
```

### Methods Available

#### `findById(id: string)`

Tìm entity theo ID, throw `NotFoundException` nếu không tìm thấy:

```typescript
const user = await usersRepository.findById('user-id');
// Throws NotFoundException if not found
```

#### `findByIdOrNull(id: string)`

Tìm entity theo ID, return `null` nếu không tìm thấy:

```typescript
const user = await usersRepository.findByIdOrNull('user-id');
// Returns null if not found
```

#### `exists(id: string)`

Kiểm tra entity có tồn tại không:

```typescript
const exists = await usersRepository.exists('user-id');
// Returns true or false
```

#### `findActive()` / `findInactive()`

Tìm các entities active/inactive (nếu entity có field `isActive`):

```typescript
const activeUsers = await usersRepository.findActive();
const inactiveUsers = await usersRepository.findInactive();
```

## 📦 Custom Repositories

### Tạo Custom Repository

```typescript
// src/modules/users/repositories/users.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { BaseRepository } from '../../../common/repositories/base.repository';

@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super(userRepository.target, userRepository.manager, userRepository.queryRunner);
  }

  // Custom methods
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }
}
```

### Register Repository trong Module

```typescript
// src/modules/users/users.module.ts
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersRepository } from './repositories/users.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
```

## 💻 Sử dụng trong Services

### Trước khi có Repository Pattern

```typescript
// ❌ Bad - Service inject repository trực tiếp
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }
}
```

### Sau khi có Repository Pattern

```typescript
// ✅ Good - Service inject custom repository
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
  ) {}

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }
}
```

## ✅ Best Practices

### 1. Extend Base Repository

```typescript
// ✅ Good
export class UsersRepository extends BaseRepository<User> {
  // Custom methods
}

// ❌ Bad - Không extend base repository
export class UsersRepository {
  // Phải implement lại tất cả common methods
}
```

### 2. Tách biệt Data Access Logic

```typescript
// ✅ Good - Repository chứa data access logic
async findByEmail(email: string): Promise<User | null> {
  return this.userRepository.findOne({ where: { email } });
}

// ❌ Bad - Service chứa data access logic
async findByEmail(email: string) {
  return this.userRepository.findOne({ where: { email } });
}
```

### 3. Sử dụng Custom Methods

```typescript
// ✅ Good - Sử dụng custom repository methods
const user = await this.usersRepository.findByEmail(email);

// ❌ Bad - Sử dụng repository trực tiếp
const user = await this.userRepository.findOne({ where: { email } });
```

### 4. Return Types rõ ràng

```typescript
// ✅ Good - Return type rõ ràng
async findByEmail(email: string): Promise<User | null> {
  return this.userRepository.findOne({ where: { email } });
}

// ❌ Bad - Return type không rõ ràng
async findByEmail(email: string) {
  return this.userRepository.findOne({ where: { email } });
}
```

### 5. Handle Errors trong Repository

```typescript
// ✅ Good - Repository throw exceptions
async findById(id: string): Promise<User> {
  const user = await this.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundException(`User with ID ${id} not found`);
  }
  return user;
}
```

## 📖 Ví dụ

### Complete Repository Example

```typescript
// src/modules/users/repositories/users.repository.ts
@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super(userRepository.target, userRepository.manager, userRepository.queryRunner);
  }

  // Custom: Find by email
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  // Custom: Find by email with password
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'firstName', 'lastName', 'role'],
    });
  }

  // Custom: Find by role
  async findByRole(role: string): Promise<User[]> {
    return this.userRepository.find({ where: { role } as any });
  }

  // Custom: Check email exists
  async emailExists(email: string): Promise<boolean> {
    const count = await this.userRepository.count({ where: { email } });
    return count > 0;
  }
}
```

### Complete Service Example

```typescript
// src/modules/users/services/users.service.ts
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    // Sử dụng repository method
    if (await this.usersRepository.emailExists(dto.email)) {
      throw new ConflictException('Email already exists');
    }

    const user = this.usersRepository.create(dto);
    return this.usersRepository.save(user);
  }

  async findOne(id: string): Promise<User> {
    // Sử dụng base repository method
    return this.usersRepository.findByIdWithoutPassword(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    // Sử dụng custom repository method
    return this.usersRepository.findByEmail(email);
  }
}
```

## 🔄 Migration từ Direct Repository

### Bước 1: Tạo Custom Repository

```typescript
// src/modules/users/repositories/users.repository.ts
@Injectable()
export class UsersRepository extends BaseRepository<User> {
  // Move data access methods từ service vào đây
}
```

### Bước 2: Register Repository

```typescript
// src/modules/users/users.module.ts
@Module({
  providers: [UsersService, UsersRepository],
  exports: [UsersRepository],
})
```

### Bước 3: Update Service

```typescript
// src/modules/users/services/users.service.ts
// Thay đổi từ:
@InjectRepository(User) private userRepository: Repository<User>

// Thành:
private readonly usersRepository: UsersRepository
```

## 🧪 Testing với Repository

### Mock Repository trong Tests

```typescript
describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
            emailExists: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);
  });

  it('should find user by email', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    jest.spyOn(repository, 'findByEmail').mockResolvedValue(mockUser);

    const result = await service.findByEmail('test@example.com');
    expect(result).toEqual(mockUser);
  });
});
```

## 🔗 Tài liệu liên quan

- [TypeORM Repository](https://typeorm.io/repository-api)
- [NestJS Custom Providers](https://docs.nestjs.com/fundamentals/custom-providers)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
