# Hướng dẫn Base Entity

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Base Entity](#base-entity)
- [Sử dụng Base Entity](#sử-dụng-base-entity)
- [Best Practices](#best-practices)
- [Ví dụ](#ví-dụ)

## 🎯 Tổng quan

Base Entity giúp:

- ✅ **DRY Principle** - Không lặp lại common fields
- ✅ **Consistency** - Tất cả entities có cùng structure
- ✅ **Maintainability** - Dễ thay đổi common fields
- ✅ **Type Safety** - TypeScript type checking
- ✅ **Less Code** - Giảm boilerplate code

## 🏗️ Base Entity

Base Entity chứa các fields chung cho tất cả entities:

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

### Fields

- **`id`** - UUID primary key (auto-generated)
- **`createdAt`** - Timestamp khi entity được tạo (auto-set)
- **`updatedAt`** - Timestamp khi entity được update (auto-update)

## 📦 Sử dụng Base Entity

### Trước khi có Base Entity

```typescript
// ❌ Bad - Lặp lại common fields
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Sau khi có Base Entity

```typescript
// ✅ Good - Extend từ Base Entity
@Entity('users')
export class User extends BaseEntity {
  @Column()
  email: string;
}

@Entity('posts')
export class Post extends BaseEntity {
  @Column()
  title: string;
}
```

## ✅ Best Practices

### 1. Luôn extend Base Entity

```typescript
// ✅ Good - Extend Base Entity
@Entity('users')
export class User extends BaseEntity {
  @Column()
  email: string;
}

// ❌ Bad - Không extend Base Entity
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  // ...
}
```

### 2. Không override common fields

```typescript
// ✅ Good - Không override
@Entity('users')
export class User extends BaseEntity {
  @Column()
  email: string;
}

// ❌ Bad - Override common fields
@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('increment') // Override id
  id: number;
}
```

### 3. Sử dụng trong Repositories

```typescript
// ✅ Good - Type constraint với Base Entity
export abstract class BaseRepository<T extends BaseEntity> {
  async findById(id: string): Promise<T> {
    // id field guaranteed to exist
  }
}
```

### 4. Sử dụng trong Mappers

```typescript
// ✅ Good - Base Entity fields trong DTO
export class UserDto {
  id: string; // From Base Entity
  createdAt: Date; // From Base Entity
  updatedAt: Date; // From Base Entity
  email: string;
}
```

## 📖 Ví dụ

### Complete Entity Example

```typescript
// src/modules/users/entities/user.entity.ts
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  // Inherited from BaseEntity:
  // - id: string
  // - createdAt: Date
  // - updatedAt: Date
}
```

### Multiple Entities

```typescript
// src/modules/posts/entities/post.entity.ts
import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('posts')
export class Post extends BaseEntity {
  @Column()
  title: string;

  @Column('text')
  content: string;

  @ManyToOne(() => User)
  author: User;

  // Inherited from BaseEntity:
  // - id: string
  // - createdAt: Date
  // - updatedAt: Date
}

// src/modules/comments/entities/comment.entity.ts
import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity('comments')
export class Comment extends BaseEntity {
  @Column('text')
  content: string;

  @ManyToOne(() => Post)
  post: Post;

  // Inherited from BaseEntity:
  // - id: string
  // - createdAt: Date
  // - updatedAt: Date
}
```

## 🔄 Migration từ Existing Entities

### Bước 1: Tạo Base Entity

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

### Bước 2: Update Entity

```typescript
// Before
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  // ... other fields
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
}

// After
import { BaseEntity } from '../../../shared/entities/base.entity';

@Entity('users')
export class User extends BaseEntity {
  // ... other fields only
  // id, createdAt, updatedAt inherited
}
```

### Bước 3: Remove Common Fields

Xóa các decorators và fields đã có trong Base Entity:

- `@PrimaryGeneratedColumn('uuid')` và `id: string`
- `@CreateDateColumn()` và `createdAt: Date`
- `@UpdateDateColumn()` và `updatedAt: Date`

## 🎨 Advanced: Custom Base Entity

### Base Entity với Soft Delete

```typescript
// src/shared/entities/base.entity.ts
import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
```

### Base Entity với Version

```typescript
// src/shared/entities/base.entity.ts
import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}
```

## 🧪 Testing với Base Entity

### Test Entity có Base Fields

```typescript
describe('User Entity', () => {
  it('should have base entity fields', () => {
    const user = new User();
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
  });

  it('should auto-generate id', async () => {
    const user = new User();
    user.email = 'test@example.com';
    const saved = await repository.save(user);
    expect(saved.id).toBeDefined();
    expect(typeof saved.id).toBe('string');
  });

  it('should auto-set timestamps', async () => {
    const user = new User();
    user.email = 'test@example.com';
    const saved = await repository.save(user);
    expect(saved.createdAt).toBeInstanceOf(Date);
    expect(saved.updatedAt).toBeInstanceOf(Date);
  });
});
```

## 🔗 Tài liệu liên quan

- [TypeORM Decorators](https://typeorm.io/decorator-reference)
- [TypeORM Entities](https://typeorm.io/entities)
- [DRY Principle](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)
