# Hướng dẫn Sử dụng TypeORM

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Cấu hình](#cấu-hình)
- [Entities](#entities)
- [Repositories](#repositories)
- [Migrations](#migrations)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Tổng quan

Dự án sử dụng **TypeORM** - một ORM mạnh mẽ cho TypeScript và JavaScript. TypeORM hỗ trợ:
- ✅ PostgreSQL database
- ✅ Entity definitions với decorators
- ✅ Repository pattern
- ✅ Migrations
- ✅ Connection pooling
- ✅ Query builder

## ⚙️ Cấu hình

### Database Module

Database được cấu hình trong `src/infrastructure/database/database.module.ts`:

```typescript
TypeOrmModule.forRootAsync({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '../../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
  synchronize: !isProduction, // false trong production
  logging: !isProduction,
})
```

### Environment Variables

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=nestjs_db
DB_SSL=false  # true cho production với SSL
```

### Connection Pooling

TypeORM tự động quản lý connection pool:
- **Max connections:** 10
- **Min connections:** 2
- **Idle timeout:** 30 seconds
- **Connection timeout:** 2 seconds

## 📦 Entities

### Định nghĩa Entity

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Decorators phổ biến

- `@Entity('table_name')` - Định nghĩa entity và table name
- `@PrimaryGeneratedColumn('uuid')` - Primary key tự động generate UUID
- `@Column()` - Column thông thường
- `@Column({ unique: true })` - Column unique
- `@Column({ nullable: true })` - Column có thể null
- `@Column({ default: value })` - Default value
- `@CreateDateColumn()` - Tự động set khi tạo
- `@UpdateDateColumn()` - Tự động update khi sửa
- `@Index()` - Tạo index

### Relationships

```typescript
// One-to-Many
@OneToMany(() => Post, post => post.user)
posts: Post[];

// Many-to-One
@ManyToOne(() => User, user => user.posts)
user: User;

// Many-to-Many
@ManyToMany(() => Category)
@JoinTable()
categories: Category[];
```

## 🔄 Repositories

### Inject Repository

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(userData: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: string, userData: UpdateUserDto): Promise<User> {
    await this.userRepository.update(id, userData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
```

### Query Methods

```typescript
// Find all
const users = await this.userRepository.find();

// Find with conditions
const user = await this.userRepository.findOne({
  where: { email: 'user@example.com' },
});

// Find with relations
const user = await this.userRepository.findOne({
  where: { id },
  relations: ['posts'],
});

// Find with select
const user = await this.userRepository.findOne({
  where: { id },
  select: ['id', 'email', 'firstName'],
});

// Find with order
const users = await this.userRepository.find({
  order: { createdAt: 'DESC' },
});

// Find with pagination
const [users, total] = await this.userRepository.findAndCount({
  skip: (page - 1) * limit,
  take: limit,
});
```

### Query Builder

```typescript
// Simple query
const users = await this.userRepository
  .createQueryBuilder('user')
  .where('user.email = :email', { email: 'user@example.com' })
  .getOne();

// Complex query
const users = await this.userRepository
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.posts', 'post')
  .where('user.isActive = :isActive', { isActive: true })
  .andWhere('post.published = :published', { published: true })
  .orderBy('user.createdAt', 'DESC')
  .skip((page - 1) * limit)
  .take(limit)
  .getManyAndCount();
```

## 🔀 Migrations

### Tạo Migration

```bash
# Generate migration từ entities
npm run migration:generate src/infrastructure/database/migrations/CreateUserTable

# Tạo migration trống
npm run migration:create src/infrastructure/database/migrations/CreateUserTable
```

### Migration Example

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "firstName" character varying NOT NULL,
        "lastName" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'user',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
```

### Chạy Migrations

```bash
# Chạy tất cả migrations chưa chạy
npm run migration:run

# Revert migration cuối cùng
npm run migration:revert

# Xem trạng thái migrations
npm run migration:show
```

### Migration Scripts

```json
{
  "migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/infrastructure/database/orm.config.ts",
  "migration:create": "typeorm-ts-node-commonjs migration:create",
  "migration:run": "typeorm-ts-node-commonjs migration:run -d src/infrastructure/database/orm.config.ts",
  "migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/infrastructure/database/orm.config.ts",
  "migration:show": "typeorm-ts-node-commonjs migration:show -d src/infrastructure/database/orm.config.ts"
}
```

## 💡 Best Practices

### 1. Sử dụng Migrations thay vì Synchronize

✅ **Production:**
```typescript
synchronize: false, // Luôn false trong production
```

❌ **Development:**
```typescript
synchronize: true, // Chỉ dùng trong development
```

### 2. Select chỉ fields cần thiết

✅ **Good:**
```typescript
const user = await this.userRepository.findOne({
  where: { id },
  select: ['id', 'email', 'firstName'],
});
```

❌ **Bad:**
```typescript
const user = await this.userRepository.findOne({ where: { id } });
// Lấy tất cả fields kể cả password
```

### 3. Sử dụng Transactions

```typescript
await this.userRepository.manager.transaction(async (manager) => {
  const user = manager.create(User, userData);
  await manager.save(user);
  
  const profile = manager.create(Profile, profileData);
  await manager.save(profile);
});
```

### 4. Index cho performance

```typescript
@Entity('users')
@Index(['email'])
@Index(['createdAt'])
export class User {
  // ...
}
```

### 5. Soft Delete

```typescript
import { DeleteDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @DeleteDateColumn()
  deletedAt: Date;
}

// Sử dụng
await this.userRepository.softDelete(id);
const user = await this.userRepository.findOne({
  where: { id },
  withDeleted: true, // Include deleted records
});
```

### 6. Query Optimization

```typescript
// Sử dụng relations thay vì multiple queries
const user = await this.userRepository.findOne({
  where: { id },
  relations: ['posts', 'profile'],
});

// Sử dụng select để giảm data transfer
const users = await this.userRepository.find({
  select: ['id', 'email'],
});
```

## 🐛 Troubleshooting

### Connection Error

**Lỗi:** `Connection refused` hoặc `Cannot connect to database`

**Giải pháp:**
1. Kiểm tra database đang chạy
2. Kiểm tra environment variables
3. Kiểm tra network/firewall

```bash
# Test connection
docker-compose exec postgres psql -U postgres -d nestjs_db
```

### Migration Error

**Lỗi:** `Migration already executed`

**Giải pháp:**
```bash
# Xem migrations đã chạy
npm run migration:show

# Revert nếu cần
npm run migration:revert
```

### Entity Not Found

**Lỗi:** `Entity metadata not found`

**Giải pháp:**
1. Đảm bảo entity được import trong module
2. Kiểm tra path trong `entities` array
3. Rebuild project: `npm run build`

### Performance Issues

**Giải pháp:**
1. Sử dụng indexes
2. Select chỉ fields cần thiết
3. Sử dụng pagination
4. Optimize queries với query builder

## 📖 Ví dụ

### Complete Service với TypeORM

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(page = 1, limit = 10) {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async delete(id: string) {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
```

## 🔗 Tài liệu liên quan

- [TypeORM Documentation](https://typeorm.io/)
- [NestJS TypeORM](https://docs.nestjs.com/techniques/database)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
