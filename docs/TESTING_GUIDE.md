# Hướng dẫn Testing Chi Tiết

Tài liệu này mô tả đầy đủ cách triển khai test cho dự án theo 3 lớp:

1. Unit tests (logic nghiệp vụ)
2. E2E tests (flow API quan trọng)
3. CI + coverage threshold (tự fail khi coverage thấp)

---

## 1) Cấu trúc test hiện tại

- Unit test:
  - `test/modules/users/users.service.spec.ts`
- E2E test:
  - `test/e2e/auth-users-flow.e2e-spec.ts`
  - `test/e2e/smoke.e2e-spec.ts`
- Jest config e2e:
  - `test/jest-e2e.json`

---

## 2) Các lệnh test

- `npm test`
  - Chạy unit tests (`src/**/*.spec.ts` + `test/**/*.spec.ts`)
  - Tự bỏ qua `test/e2e/`

- `npm run test:watch`
  - Chạy unit tests ở chế độ watch

- `npm run test:cov`
  - Chạy unit tests + generate report coverage vào thư mục `coverage/`

- `npm run test:ci`
  - Chạy unit tests ở chế độ CI (`--runInBand --coverage`)
  - Sẽ fail nếu không đạt coverage threshold trong `package.json`

- `npm run test:e2e -- --runInBand`
  - Chạy e2e test theo config `test/jest-e2e.json`

---

## 3) Unit test cho UsersService (đúng nghiệp vụ)

File: `test/modules/users/users.service.spec.ts`

Các nghiệp vụ đang được cover:

- `create`
  - tạo user thành công
  - hash password trước khi lưu
  - throw `ConflictException` khi email đã tồn tại

- `updateProfile`
  - chỉ update field cho phép (`firstName`, `lastName`, `password`)
  - nếu payload rỗng thì không gọi save
  - password mới được hash

- `update`
  - update field bình thường (không password)
  - update password có hash
  - payload rỗng thì trả user hiện tại, không save

Ghi chú:
- Dùng mock repository để test đúng business logic của service.
- Không phụ thuộc DB/Redis khi chạy unit test.

---

## 4) E2E flow Auth + Users (JWT, profile, update)

File: `test/e2e/auth-users-flow.e2e-spec.ts`

Flow đang được verify:

1. `POST /auth/register` -> nhận `access_token`, `refresh_token`
2. `POST /auth/login` -> login bằng email/password
3. `GET /users/profile` với JWT -> lấy profile hiện tại
4. `PATCH /users/profile` với JWT -> update firstName + password
5. Login lại bằng password mới -> thành công
6. Truy cập endpoint protected không token -> bị chặn

Ghi chú kỹ thuật:
- E2E test hiện tại là **E2E-like** trong TestingModule (không mở HTTP socket).
- Dùng in-memory repository + in-memory refresh token service để đảm bảo test chạy nhanh, độc lập hạ tầng.
- JWT vẫn được verify thật bằng `JwtService` để đảm bảo logic auth.

---

## 5) Coverage threshold và cơ chế fail

Đã setup trong `package.json`:

- Global threshold:
  - branches: 80
  - functions: 90
  - lines: 85
  - statements: 85

- Threshold cho file nghiệp vụ quan trọng:
  - `src/modules/users/services/users.service.ts`
  - branches: 80
  - functions: 90
  - lines: 85
  - statements: 85

Nếu thấp hơn ngưỡng trên, `npm run test:ci` sẽ trả exit code 1 (fail pipeline).

---

## 6) CI workflow (GitHub Actions)

File: `.github/workflows/test.yml`

Pipeline đang chạy:

1. `npm ci`
2. `npm run test:ci` (unit + coverage threshold)
3. `npm run test:e2e -- --runInBand`

Workflow trigger trên cả `push` và `pull_request`.

---

## 7) Cách mở rộng test tiếp theo

Đề xuất ưu tiên:

1. Thêm unit test cho `AuthService`:
   - `login` sai mật khẩu -> unauthorized
   - `refreshAccessToken` token invalid
   - `logout` revoke refresh token

2. Thêm test validation ở e2e:
   - password ngắn
   - email invalid
   - payload có field không cho phép

3. Thêm test edge-case users:
   - update profile payload rỗng
   - inactive user không truy cập endpoint protected

4. Bật check quality trước merge:
   - `npm run lint`
   - `npm run test:ci`
   - `npm run test:e2e -- --runInBand`

---

## 8) Test Pyramid chuẩn cho repo này

Tỷ lệ mục tiêu toàn repo:

- Unit tests: **70%**
- Integration tests: **20%**
- E2E/E2E-like tests: **10%**

Sơ đồ ASCII:

```text
                 /\
                /  \      E2E / E2E-like (10%)
               /____\
              /      \    Integration (20%)
             /________\
            /          \  Unit (70%)
           /____________\
```

Phân bổ ưu tiên theo module:

- `users`: Unit 75% / Integration 15% / E2E 10%
- `auth`: Unit 65% / Integration 20% / E2E 15%
- `admin`: Unit 70% / Integration 20% / E2E 10%
- `infrastructure` (cache/queue/mail/storage/health/security): Unit 80% / Integration 15% / E2E 5%
- `common/shared`: Unit 85% / Integration 10% / E2E 5%

---

## 9) Checklist test khi tạo feature mới (Template PR)

Copy phần này vào description của PR:

```markdown
## Testing Checklist

- [ ] Đã thêm/updated **unit test** cho business logic chính
- [ ] Đã cover case lỗi chính (validation fail / unauthorized / conflict / not found)
- [ ] Nếu có query/repository phức tạp: đã thêm **integration test**
- [ ] Nếu là flow quan trọng người dùng: đã thêm **e2e/e2e-like test**
- [ ] Đã verify không lộ dữ liệu nhạy cảm (password/token) trong response
- [ ] Đã chạy local:
  - [ ] `npm run lint`
  - [ ] `npm run test:ci`
  - [ ] `npm run test:e2e -- --runInBand`
- [ ] Coverage không giảm dưới threshold

## Test Scope

- Module(s): <!-- users/auth/admin/... -->
- Loại test thêm mới: <!-- unit/integration/e2e -->
- Các case đã cover:
  - <!-- case 1 -->
  - <!-- case 2 -->
  - <!-- case 3 -->
```
