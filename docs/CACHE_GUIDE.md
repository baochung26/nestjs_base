# Hướng dẫn Sử dụng Cache Module

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Cấu hình](#cấu-hình)
- [Cache Service](#cache-service)
- [Cache Decorators](#cache-decorators)
- [Cache Interceptors](#cache-interceptors)
- [Best Practices](#best-practices)
- [Ví dụ Sử dụng](#ví-dụ-sử-dụng)
- [Troubleshooting](#troubleshooting)

## 🎯 Tổng quan

Cache Module sử dụng **Redis** để lưu trữ cache với các tính năng:

- ✅ Redis-based caching
- ✅ TTL (Time To Live) support
- ✅ Cache-aside pattern
- ✅ Automatic cache invalidation
- ✅ Decorator-based caching
- ✅ Interceptor-based caching

## ⚙️ Cấu hình

### Redis Configuration

Cache module sử dụng Redis đã được cấu hình trong project:

```env
REDIS_HOST=redis          # hoặc localhost nếu không dùng Docker
REDIS_PORT=6379
REDIS_PASSWORD=           # Optional
REDIS_DB=0               # Database number (0-15)
```

### Cache Module Configuration

Cache được cấu hình trong `src/infrastructure/cache/cache.module.ts`:

- **Default TTL:** 3600 seconds (1 hour)
- **Max items:** 1000
- **Store:** Redis

## 📦 Cache Service

### Inject CacheService

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService } from '../infrastructure/cache/cache.service';

@Injectable()
export class YourService {
  constructor(private cacheService: CacheService) {}
}
```

### Basic Operations

#### 1. Get Value

```typescript
const value = await this.cacheService.get<string>('user:123');
if (value) {
  console.log('Cache hit:', value);
} else {
  console.log('Cache miss');
}
```

#### 2. Set Value

```typescript
// Set với default TTL (1 hour)
await this.cacheService.set('user:123', userData);

// Set với custom TTL (30 minutes)
await this.cacheService.set('user:123', userData, 1800);
```

#### 3. Delete Value

```typescript
await this.cacheService.del('user:123');
```

#### 4. Delete Multiple Keys

```typescript
await this.cacheService.delMultiple(['user:123', 'user:456', 'user:789']);
```

#### 5. Reset Entire Cache

```typescript
await this.cacheService.reset();
```

### Advanced Operations

#### Cache-Aside Pattern

```typescript
const user = await this.cacheService.getOrSet(
  'user:123',
  async () => {
    // Fetch from database if not in cache
    return await this.userRepository.findOne({ where: { id: '123' } });
  },
  3600, // TTL: 1 hour
);
```

#### Check if Key Exists

```typescript
const exists = await this.cacheService.exists('user:123');
```

#### Get Multiple Keys

```typescript
const users = await this.cacheService.getMultiple<User>([
  'user:123',
  'user:456',
  'user:789',
]);

users.forEach((user, key) => {
  if (user) {
    console.log(`${key}:`, user);
  }
});
```

#### Set Multiple Keys

```typescript
await this.cacheService.setMultiple([
  { key: 'user:123', value: user1, ttl: 3600 },
  { key: 'user:456', value: user2, ttl: 3600 },
  { key: 'user:789', value: user3, ttl: 3600 },
]);
```

#### Increment/Decrement

```typescript
// Increment
const views = await this.cacheService.increment('post:123:views');
// Decrement
const likes = await this.cacheService.decrement('post:123:likes', 1);
```

#### Generate Cache Key

```typescript
const key = this.cacheService.generateKey('user', userId, 'profile');
// Result: "user:123:profile"
```

## 🎨 Cache Decorators

### @Cache Decorator

Cache response tự động với TTL:

```typescript
import { Controller, Get } from '@nestjs/common';
import { Cache } from '../common/decorators/cache.decorator';

@Controller('users')
export class UsersController {
  @Get(':id')
  @Cache(3600) // Cache for 1 hour
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get()
  @Cache(1800, 'users:list') // Cache for 30 minutes with custom key
  async findAll() {
    return this.usersService.findAll();
  }
}
```

### @SkipCache Decorator

Skip caching for specific endpoint:

```typescript
import { SkipCache } from '../common/decorators/cache.decorator';

@Get('sensitive-data')
@SkipCache()
async getSensitiveData() {
  // This will not be cached
  return this.getData();
}
```

### @CacheEvict Decorator

Evict cache after operation:

```typescript
import { CacheEvict } from '../common/interceptors/cache-evict.interceptor';

@Put(':id')
@CacheEvict('users:list') // Evict specific key
async update(@Param('id') id: string, @Body() data: UpdateUserDto) {
  return this.usersService.update(id, data);
}

@Delete(':id')
@CacheEvict() // Evict based on request
async delete(@Param('id') id: string) {
  return this.usersService.delete(id);
}
```

## 🔄 Cache Interceptors

### CacheInterceptor

Tự động cache responses dựa trên decorator:

```typescript
import { UseInterceptors } from '@nestjs/common';
import { CacheInterceptor } from '../common/interceptors/cache.interceptor';

@Controller('users')
@UseInterceptors(CacheInterceptor)
export class UsersController {
  @Get(':id')
  @Cache(3600)
  async findOne(@Param('id') id: string) {
    // Response will be cached automatically
    return this.usersService.findOne(id);
  }
}
```

### CacheEvictInterceptor

Tự động evict cache sau khi update/delete:

```typescript
import { CacheEvictInterceptor } from '../common/interceptors/cache-evict.interceptor';

@Controller('users')
@UseInterceptors(CacheEvictInterceptor)
export class UsersController {
  @Put(':id')
  @CacheEvict('users:list')
  async update(@Param('id') id: string, @Body() data: UpdateUserDto) {
    // Cache will be evicted after update
    return this.usersService.update(id, data);
  }
}
```

## 💡 Best Practices

### 1. Cache Key Naming

✅ **Good:**

```typescript
const key = this.cacheService.generateKey('user', userId, 'profile');
// Result: "user:123:profile"
```

❌ **Bad:**

```typescript
const key = `user_${userId}_profile`; // Inconsistent naming
```

### 2. TTL Strategy

```typescript
// Static data - Long TTL
@Cache(86400) // 24 hours
async getStaticData() { }

// Dynamic data - Short TTL
@Cache(300) // 5 minutes
async getDynamicData() { }

// User-specific data - Medium TTL
@Cache(3600) // 1 hour
async getUserData() { }
```

### 3. Cache-Aside Pattern

```typescript
async getUser(id: string) {
  return this.cacheService.getOrSet(
    `user:${id}`,
    () => this.userRepository.findOne({ where: { id } }),
    3600,
  );
}
```

### 4. Invalidate Related Cache

```typescript
async updateUser(id: string, data: UpdateUserDto) {
  const user = await this.userRepository.update(id, data);

  // Invalidate related cache
  await this.cacheService.delMultiple([
    `user:${id}`,
    'users:list',
    `user:${id}:profile`,
  ]);

  return user;
}
```

### 5. Cache Warming

```typescript
async warmCache() {
  const popularUsers = await this.userRepository.find({
    where: { isPopular: true },
  });

  await this.cacheService.setMultiple(
    popularUsers.map((user) => ({
      key: `user:${user.id}`,
      value: user,
      ttl: 3600,
    })),
  );
}
```

### 6. Error Handling

```typescript
async getUser(id: string) {
  try {
    const cached = await this.cacheService.get<User>(`user:${id}`);
    if (cached) {
      return cached;
    }
  } catch (error) {
    // Log error but continue to database
    this.logger.error('Cache error', error);
  }

  // Fallback to database
  return this.userRepository.findOne({ where: { id } });
}
```

## 📖 Ví dụ Sử dụng

### Complete Service với Cache

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '../infrastructure/cache/cache.service';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private cacheService: CacheService,
  ) {}

  async findOne(id: string): Promise<User> {
    const cacheKey = this.cacheService.generateKey('user', id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
      },
      3600, // 1 hour
    );
  }

  async findAll(page = 1, limit = 10) {
    const cacheKey = `users:list:${page}:${limit}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [users, total] = await this.userRepository.findAndCount({
          skip: (page - 1) * limit,
          take: limit,
        });

        return {
          data: users,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        };
      },
      1800, // 30 minutes
    );
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.update(id, data);

    // Invalidate cache
    await this.cacheService.delMultiple([
      this.cacheService.generateKey('user', id),
      'users:list',
    ]);

    return user;
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);

    // Invalidate cache
    await this.cacheService.delMultiple([
      this.cacheService.generateKey('user', id),
      'users:list',
    ]);
  }
}
```

### Controller với Cache Decorators

```typescript
import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseInterceptors,
} from '@nestjs/common';
import { Cache, SkipCache } from '../common/decorators/cache.decorator';
import {
  CacheInterceptor,
  CacheEvictInterceptor,
} from '../common/interceptors';

@Controller('users')
@UseInterceptors(CacheInterceptor)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(':id')
  @Cache(3600) // Cache for 1 hour
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get()
  @Cache(1800, 'users:list') // Cache for 30 minutes
  async findAll() {
    return this.usersService.findAll();
  }

  @Put(':id')
  @UseInterceptors(CacheEvictInterceptor)
  @CacheEvict('users:list')
  async update(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  @UseInterceptors(CacheEvictInterceptor)
  @CacheEvict('users:list')
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  @Get('sensitive/:id')
  @SkipCache() // Don't cache sensitive data
  async getSensitiveData(@Param('id') id: string) {
    return this.usersService.getSensitiveData(id);
  }
}
```

## 🐛 Troubleshooting

### Cache không hoạt động

**Nguyên nhân:** Redis chưa kết nối hoặc CacheModule chưa được import.

**Giải pháp:**

1. Kiểm tra Redis đang chạy:

   ```bash
   docker-compose ps redis
   ```

2. Đảm bảo CacheModule đã được import trong AppModule:
   ```typescript
   imports: [CacheModule, ...]
   ```

### Cache key conflict

**Nguyên nhân:** Cache keys trùng nhau giữa các modules.

**Giải pháp:** Sử dụng prefix cho cache keys:

```typescript
const key = this.cacheService.generateKey('module', 'entity', id);
```

### Memory issues

**Nguyên nhân:** Cache quá nhiều data.

**Giải pháp:**

1. Giảm TTL
2. Giảm max items trong cache config
3. Implement cache eviction strategy

### Performance issues

**Giải pháp:**

1. Sử dụng cache-aside pattern
2. Cache only frequently accessed data
3. Monitor cache hit rate
4. Use appropriate TTL values

## 🔗 Tài liệu liên quan

- [NestJS Cache Manager](https://docs.nestjs.com/techniques/caching)
- [Redis Documentation](https://redis.io/docs/)
- [cache-manager Documentation](https://github.com/node-cache-manager/node-cache-manager)
