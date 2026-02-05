# Hướng dẫn Mapper Pattern

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Base Mapper](#base-mapper)
- [Custom Mappers](#custom-mappers)
- [Sử dụng trong Services](#sử-dụng-trong-services)
- [Best Practices](#best-practices)
- [Ví dụ](#ví-dụ)

## 🎯 Tổng quan

Mapper Pattern giúp:

- ✅ **Tách biệt Entity và DTO** - Entity cho database, DTO cho API
- ✅ **Bảo mật** - Loại bỏ sensitive data (password) khỏi responses
- ✅ **Flexibility** - Dễ dàng thay đổi response format
- ✅ **Type Safety** - TypeScript type checking
- ✅ **Reusability** - Tái sử dụng mapping logic

## 🏗️ Base Mapper

Base Mapper cung cấp các methods chung:

```typescript
// src/common/mappers/base.mapper.ts
export abstract class BaseMapper<TEntity, TDto> {
  // Convert entity to DTO
  abstract toDto(entity: TEntity): TDto;

  // Convert DTO to entity (partial)
  abstract toEntity(dto: Partial<TDto>): Partial<TEntity>;

  // Convert array of entities to array of DTOs
  toDtoArray(entities: TEntity[]): TDto[];

  // Convert array of DTOs to array of entities
  toEntityArray(dtos: Partial<TDto>[]): Partial<TEntity>[];
}
```

## 📦 Custom Mappers

### Tạo Custom Mapper

```typescript
// src/modules/users/mappers/user.mapper.ts
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserDto } from '../dtos/user.dto';
import { BaseMapper } from '../../../common/mappers/base.mapper';

export class UserMapper extends BaseMapper<User, UserDto> {
  toDto(user: User): UserDto {
    const dto = new UserDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    // Exclude password
    return dto;
  }

  toEntity(dto: Partial<CreateUserDto>): Partial<User> {
    const entity: Partial<User> = {};
    if (dto.email) entity.email = dto.email;
    if (dto.firstName) entity.firstName = dto.firstName;
    // Exclude password (handled separately)
    return entity;
  }
}
```

### UserDto

Tạo DTO cho response (không có sensitive data):

```typescript
// src/modules/users/dtos/user.dto.ts
export class UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // No password field
}
```

## 💻 Sử dụng trong Services

### Trước khi có Mapper Pattern

```typescript
// ❌ Bad - Return entity trực tiếp (có thể expose password)
async findOne(id: string): Promise<User> {
  return this.repository.findOne({ where: { id } });
}
```

### Sau khi có Mapper Pattern

```typescript
// ✅ Good - Return DTO (không có password)
async findOne(id: string): Promise<UserDto> {
  const user = await this.repository.findById(id);
  return this.userMapper.toDto(user);
}
```

## ✅ Best Practices

### 1. Luôn exclude sensitive data

```typescript
// ✅ Good - Exclude password
toDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    // No password
  };
}

// ❌ Bad - Include password
toDto(user: User): UserDto {
  return {
    ...user, // Includes password!
  };
}
```

### 2. Sử dụng Partial cho toEntity

```typescript
// ✅ Good - Use Partial
toEntity(dto: Partial<CreateUserDto>): Partial<User> {
  // Only map fields that exist
}

// ❌ Bad - Require all fields
toEntity(dto: CreateUserDto): User {
  // Must have all fields
}
```

### 3. Handle null/undefined

```typescript
// ✅ Good - Handle null
toDto(user: User | null): UserDto | null {
  if (!user) return null;
  return { /* ... */ };
}

// ❌ Bad - No null handling
toDto(user: User): UserDto {
  return { /* ... */ }; // Crashes if user is null
}
```

### 4. Separate mappers cho different DTOs

```typescript
// ✅ Good - Separate methods
toDto(user: User): UserDto { }
toPublicDto(user: User): PublicUserDto { }
toAdminDto(user: User): AdminUserDto { }
```

### 5. Use mapper trong service

```typescript
// ✅ Good - Use mapper
async findAll(): Promise<UserDto[]> {
  const users = await this.repository.findAll();
  return this.userMapper.toDtoArray(users);
}

// ❌ Bad - Manual mapping
async findAll(): Promise<UserDto[]> {
  const users = await this.repository.findAll();
  return users.map(u => ({ id: u.id, email: u.email, /* ... */ }));
}
```

## 📖 Ví dụ

### Complete Mapper Example

```typescript
// src/modules/users/mappers/user.mapper.ts
export class UserMapper extends BaseMapper<User, UserDto> {
  toDto(user: User): UserDto {
    const dto = new UserDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.role = user.role;
    dto.isActive = user.isActive;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }

  toEntity(dto: Partial<CreateUserDto>): Partial<User> {
    const entity: Partial<User> = {};
    if (dto.email) entity.email = dto.email;
    if (dto.firstName) entity.firstName = dto.firstName;
    if (dto.lastName) entity.lastName = dto.lastName;
    if (dto.role) entity.role = dto.role;
    return entity;
  }

  toEntityFromUpdate(dto: Partial<UpdateUserDto>): Partial<User> {
    const entity: Partial<User> = {};
    if (dto.email) entity.email = dto.email;
    if (dto.firstName) entity.firstName = dto.firstName;
    if (dto.lastName) entity.lastName = dto.lastName;
    if (dto.role) entity.role = dto.role;
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;
    return entity;
  }
}
```

### Complete Service Example

```typescript
// src/modules/users/services/users.service.ts
@Injectable()
export class UsersService {
  private readonly userMapper = new UserMapper();

  async create(dto: CreateUserDto): Promise<UserDto> {
    const userData = this.userMapper.toEntity(dto);
    const user = this.repository.create({
      ...userData,
      password: hashedPassword,
    });
    const savedUser = await this.repository.save(user);
    return this.userMapper.toDto(savedUser);
  }

  async findOne(id: string): Promise<UserDto> {
    const user = await this.repository.findById(id);
    return this.userMapper.toDto(user);
  }

  async findAll(): Promise<UserDto[]> {
    const users = await this.repository.findAll();
    return this.userMapper.toDtoArray(users);
  }
}
```

## 🔄 Multiple DTOs

### Public vs Admin DTOs

```typescript
// Public DTO (limited fields)
export class PublicUserDto {
  id: string;
  firstName: string;
  lastName: string;
  // No email, no role
}

// Admin DTO (all fields)
export class AdminUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mapper với multiple methods
export class UserMapper {
  toPublicDto(user: User): PublicUserDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  toAdminDto(user: User): AdminUserDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
```

## 🧪 Testing với Mappers

### Test Mapper

```typescript
describe('UserMapper', () => {
  let mapper: UserMapper;

  beforeEach(() => {
    mapper = new UserMapper();
  });

  it('should convert entity to DTO', () => {
    const user = {
      id: '1',
      email: 'test@example.com',
      password: 'hashed',
      firstName: 'John',
      lastName: 'Doe',
    } as User;

    const dto = mapper.toDto(user);

    expect(dto.id).toBe('1');
    expect(dto.email).toBe('test@example.com');
    expect(dto).not.toHaveProperty('password');
  });
});
```

## 🔗 Tài liệu liên quan

- [DTO Pattern](https://martinfowler.com/eaaCatalog/dataTransferObject.html)
- [NestJS DTOs](https://docs.nestjs.com/controllers#request-payloads)
- [TypeScript Mappers](https://www.typescriptlang.org/docs/handbook/utility-types.html)
