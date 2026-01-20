# Hướng dẫn Testing Setup (Jest)

Dự án đã được cấu hình sẵn Jest trong `package.json`.

## Scripts

- `npm test` - chạy toàn bộ unit tests
- `npm run test:watch` - chạy tests ở chế độ watch
- `npm run test:cov` - chạy tests và generate coverage report

## Ví dụ: UsersService

File: `test/modules/users/users.service.spec.ts`

```typescript
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
