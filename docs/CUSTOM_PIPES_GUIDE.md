# Hướng dẫn Custom Pipes

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Available Pipes](#available-pipes)
- [Sử dụng Pipes](#sử-dụng-pipes)
- [Best Practices](#best-practices)
- [Ví dụ](#ví-dụ)

## 🎯 Tổng quan

Custom Pipes giúp:

- ✅ **Validation** - Validate và transform input data
- ✅ **Type Safety** - Đảm bảo type correctness
- ✅ **Error Handling** - Custom error messages
- ✅ **Data Transformation** - Transform data format
- ✅ **Reusability** - Tái sử dụng validation logic

## 📦 Available Pipes

### 1. ParseIntPipe

Parse string to integer với validation.

```typescript
import { ParseIntPipe } from '../common/pipes';

@Get(':id')
findOne(@Param('id', new ParseIntPipe(1, 100)) id: number) {
  // id is guaranteed to be a number between 1 and 100
}
```

**Features:**

- Parse string to integer
- Optional min/max validation
- Custom error messages

### 2. ParseUUIDPipe

Validate UUID format.

```typescript
import { ParseUUIDPipe } from '../common/pipes';

@Get(':id')
findOne(@Param('id', ParseUUIDPipe) id: string) {
  // id is guaranteed to be a valid UUID
}
```

**Features:**

- UUID format validation
- Clear error messages

### 3. ParseEnumPipe

Validate enum values.

```typescript
import { ParseEnumPipe } from '../common/pipes';
import { UserRole } from '../entities/user.entity';

@Get('by-role/:role')
findByRole(@Param('role', new ParseEnumPipe(UserRole)) role: UserRole) {
  // role is guaranteed to be a valid UserRole
}
```

**Features:**

- Enum value validation
- Lists valid values in error message

### 4. TrimPipe

Trim whitespace từ strings.

```typescript
import { TrimPipe } from '../common/pipes';

@Post()
create(@Body(new TrimPipe(['email', 'firstName'])) createDto: CreateUserDto) {
  // email and firstName are trimmed
}

// Or trim all strings
@Post()
create(@Body(new TrimPipe()) createDto: CreateUserDto) {
  // All string fields are trimmed
}
```

**Features:**

- Trim specific fields or all strings
- Works with nested objects
- Works with arrays

### 5. PaginationPipe

Parse và validate pagination query parameters.

```typescript
import { PaginationPipe } from '../common/pipes';

@Get()
findAll(@Query(new PaginationPipe()) pagination: { page: number; limit: number; skip: number }) {
  // pagination.page, pagination.limit, pagination.skip are validated
}
```

**Features:**

- Default values từ constants
- Min/max limit validation
- Calculate skip value

## 💻 Sử dụng Pipes

### Trong Controller

```typescript
import { Controller, Get, Param, Query, Body, Post } from '@nestjs/common';
import {
  ParseIntPipe,
  ParseUUIDPipe,
  ParseEnumPipe,
  TrimPipe,
  PaginationPipe,
} from '../common/pipes';

@Controller('users')
export class UsersController {
  // ParseIntPipe với min/max
  @Get(':id')
  findOne(@Param('id', new ParseIntPipe(1, 1000)) id: number) {
    return this.service.findOne(id);
  }

  // ParseUUIDPipe
  @Get('uuid/:id')
  findByUuid(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findByUuid(id);
  }

  // ParseEnumPipe
  @Get('by-role/:role')
  findByRole(@Param('role', new ParseEnumPipe(UserRole)) role: UserRole) {
    return this.service.findByRole(role);
  }

  // TrimPipe cho body
  @Post()
  create(@Body(new TrimPipe(['email', 'firstName'])) createDto: CreateUserDto) {
    return this.service.create(createDto);
  }

  // PaginationPipe cho query
  @Get()
  findAll(@Query(new PaginationPipe()) pagination: any) {
    return this.service.findAll(pagination);
  }
}
```

### Global Pipes

Có thể register pipes globally trong `main.ts`:

```typescript
// main.ts
import { TrimPipe } from './common/pipes';

app.useGlobalPipes(new TrimPipe(['email', 'firstName']));
```

## ✅ Best Practices

### 1. Sử dụng đúng Pipe cho từng use case

```typescript
// ✅ Good - ParseIntPipe cho numeric IDs
@Get(':id')
findOne(@Param('id', new ParseIntPipe()) id: number) { }

// ❌ Bad - Không validate
@Get(':id')
findOne(@Param('id') id: string) {
  const numId = parseInt(id); // Có thể fail
}
```

### 2. Combine với class-validator

```typescript
// ✅ Good - Pipe + DTO validation
@Post()
create(@Body(new TrimPipe(), ValidationPipe) createDto: CreateUserDto) {
  // TrimPipe trước, ValidationPipe sau
}
```

### 3. Custom error messages

```typescript
// ✅ Good - Custom error message
@Get(':id')
findOne(@Param('id', new ParseIntPipe(1, 100)) id: number) {
  // Error message includes min/max
}
```

### 4. Reuse pipes

```typescript
// ✅ Good - Define once, reuse
const userIdPipe = new ParseIntPipe(1, 1000);

@Get(':id')
findOne(@Param('id', userIdPipe) id: number) { }

@Delete(':id')
remove(@Param('id', userIdPipe) id: number) { }
```

## 📖 Ví dụ

### Complete Controller Example

```typescript
import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import {
  ParseIntPipe,
  ParseUUIDPipe,
  ParseEnumPipe,
  TrimPipe,
  PaginationPipe,
} from '../common/pipes';
import { UserRole } from '../entities/user.entity';

@Controller('users')
export class UsersController {
  // Parse UUID
  @Get('uuid/:id')
  findByUuid(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findByUuid(id);
  }

  // Parse integer với validation
  @Get('numeric/:id')
  findByNumericId(@Param('id', new ParseIntPipe(1, 1000)) id: number) {
    return this.service.findByNumericId(id);
  }

  // Parse enum
  @Get('by-role/:role')
  findByRole(
    @Param('role', new ParseEnumPipe(UserRole, 'role')) role: UserRole,
  ) {
    return this.service.findByRole(role);
  }

  // Pagination
  @Get()
  findAll(@Query(new PaginationPipe()) pagination: any) {
    return this.service.findAll(pagination);
  }

  // Trim body
  @Post()
  create(
    @Body(new TrimPipe(['email', 'firstName', 'lastName']))
    createDto: CreateUserDto,
  ) {
    return this.service.create(createDto);
  }

  // Trim all strings
  @Post('bulk')
  createBulk(@Body(new TrimPipe()) createDtos: CreateUserDto[]) {
    return this.service.createBulk(createDtos);
  }
}
```

### Custom Pipe Example

Tạo custom pipe cho specific use case:

```typescript
// src/common/pipes/parse-date.pipe.ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParseDatePipe implements PipeTransform<string, Date> {
  transform(value: string, metadata: ArgumentMetadata): Date {
    if (!value) {
      throw new BadRequestException(`${metadata.data || 'Date'} is required`);
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new BadRequestException(
        `${metadata.data || 'Date'} must be a valid date`,
      );
    }

    return date;
  }
}
```

## 🔄 Combining Pipes

### Multiple Pipes

```typescript
// Apply multiple pipes
@Post()
create(
  @Body(
    new TrimPipe(['email']),
    new ValidationPipe({ transform: true })
  ) createDto: CreateUserDto
) {
  // TrimPipe trước, ValidationPipe sau
}
```

### Pipe Order

Pipes được apply theo thứ tự từ trái sang phải:

```typescript
@Post()
create(
  @Body(
    new TrimPipe(),           // 1. Trim strings
    new ValidationPipe()      // 2. Validate DTO
  ) createDto: CreateUserDto
) {
  // Execution order: TrimPipe -> ValidationPipe
}
```

## 🧪 Testing với Pipes

### Test Custom Pipe

```typescript
describe('ParseIntPipe', () => {
  let pipe: ParseIntPipe;

  beforeEach(() => {
    pipe = new ParseIntPipe(1, 100);
  });

  it('should parse valid integer', () => {
    const result = pipe.transform('50', { type: 'param', data: 'id' });
    expect(result).toBe(50);
  });

  it('should throw error for invalid number', () => {
    expect(() => {
      pipe.transform('abc', { type: 'param', data: 'id' });
    }).toThrow(BadRequestException);
  });

  it('should throw error for out of range', () => {
    expect(() => {
      pipe.transform('200', { type: 'param', data: 'id' });
    }).toThrow(BadRequestException);
  });
});
```

## 🔗 Tài liệu liên quan

- [NestJS Pipes](https://docs.nestjs.com/pipes)
- [Built-in Pipes](https://docs.nestjs.com/pipes#built-in-pipes)
- [Custom Pipes](https://docs.nestjs.com/pipes#custom-pipes)
