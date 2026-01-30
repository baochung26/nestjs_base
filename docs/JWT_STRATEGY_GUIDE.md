# Hướng dẫn Chiến lược JWT trong Project

Tài liệu mô tả luồng JWT từ đăng nhập (login) trả về JWT đến xác thực JWT từ request trong NestJS.

---

## Tổng quan luồng

```
[Client] --POST /auth/login--> [LocalGuard + LocalStrategy] --> [AuthService.login]
                                                                    |
                                                                    v
[Client] <-- access_token + refresh_token ----------------- [generateTokens]
                                                                    |
[Client] --GET /api/... với Header: Authorization: Bearer <access_token>
                                                                    |
                                                                    v
[JwtAuthGuard] --> [JwtStrategy] --> validate(payload) --> [request.user] --> Controller
```

---

## 1. Cấu hình JWT

### AuthModule (`src/modules/auth/auth.module.ts`)

- **JwtModule**: dùng để **ký** (sign) token khi login.
- **JwtStrategy**: dùng để **xác thực** (verify) token khi có request bảo vệ.

### Cấu hình (`src/config/configuration.ts`)

- `jwt.secret`: dùng để ký và xác minh token (biến môi trường `JWT_SECRET`).
- `jwt.accessTokenExpiresIn`: thời hạn access token (mặc định `15m`).
- `jwt.refreshTokenExpiresIn`: thời hạn refresh token (mặc định `7d`).

---

## 2. Login và trả về JWT

### 2.1. Request login

Client gửi:

```http
POST /auth/login
Content-Type: application/json

{ "email": "user@example.com", "password": "..." }
```

### 2.2. LocalAuthGuard + LocalStrategy

- Route `login` dùng `@UseGuards(LocalAuthGuard)`.
- **LocalStrategy** (`src/modules/auth/strategies/local.strategy.ts`):
  - `usernameField: 'email'`: lấy `email`, `password` từ body.
  - Gọi `authService.validateUser(email, password)` (so sánh bcrypt).
  - Nếu hợp lệ → trả user; không hợp lệ → `UnauthorizedException`.
- User hợp lệ được gán vào `request.user`.

#### LocalAuthGuard gọi LocalStrategy như thế nào, ở đâu?

**LocalAuthGuard** chỉ là một dòng:

```ts
// src/modules/auth/guards/local-auth.guard.ts
export class LocalAuthGuard extends AuthGuard('local') {}
```

- `AuthGuard('local')` là guard của `@nestjs/passport`. Chuỗi `'local'` là **tên strategy** (strategy name).
- **LocalStrategy** kế thừa `PassportStrategy(Strategy)` với `Strategy` từ `passport-local`. Trong NestJS/Passport, strategy này được đăng ký mặc định với tên **`'local'`**.
- Khi request vào route có `LocalAuthGuard`, thứ tự xảy ra:
  1. Nest gọi `LocalAuthGuard.canActivate(context)`.
  2. Bên trong, guard gọi Passport với tên strategy `'local'` → Passport tìm strategy có tên `'local'` và gọi nó.
  3. Strategy `'local'` chính là **LocalStrategy** → Passport gọi `LocalStrategy.validate(...)` (tự lấy `email`, `password` từ request body theo `usernameField: 'email'`).
  4. Nếu `validate` throw → guard trả về lỗi, request bị chặn (401). Nếu `validate` return user → Passport gán user vào `request.user`, guard cho request đi tiếp.

**Kết nối Guard ↔ Strategy** là qua **tên**: Guard dùng `AuthGuard('local')`, Strategy được đăng ký với tên `'local'` (do `PassportStrategy(Strategy)` từ `passport-local`). Không có chỗ nào trong code của bạn “gọi trực tiếp” LocalStrategy; Passport làm việc đó khi guard chạy.

#### Tại sao cần guard trong khi controller đã gọi `authService.login(loginDto)`?

Vì **guard chạy trước controller**:

1. **Thứ tự thực thi**: Request → **Guard** (LocalAuthGuard) → (nếu pass) → **Controller** (`login(loginDto)` → `authService.login(loginDto)`).
2. **Nếu sai email/password**: Guard chạy → LocalStrategy.validate throw `UnauthorizedException` → guard fail → **controller không bao giờ chạy**, client nhận 401. Nhờ đó endpoint login được “bảo vệ”: chỉ khi đã xác thực đúng mới tới bước tạo token.
3. **Nếu đúng**: Guard set `request.user`, cho request đi tiếp → controller chạy `authService.login(loginDto)` để tạo token và trả response.

Tách **xác thực** (guard + strategy) và **tạo token/response** (controller + service) giúp:

- Route login chỉ “mở” cho request đã qua xác thực local.
- Có thể tái dùng guard/strategy cho route khác (nếu cần).
- Đúng convention Passport: guard quyết định “có phải user hợp lệ không”, controller chỉ lo “làm gì với user đó”.

**Lưu ý**: Trong `AuthService.login` hiện tại vẫn gọi lại `validateUser(email, password)`. Về logic thì có thể dùng luôn `request.user` (đã được LocalStrategy set) để giảm gọi DB hai lần; guard vẫn cần để chặn request sai credentials trước khi tới controller.

### 2.3. AuthController.login

Sau khi guard/strategy thành công, controller gọi:

```ts
return this.authService.login(loginDto);
```

Trong **AuthService.login** (`src/modules/auth/services/auth.service.ts`):

1. Gọi `validateUser(loginDto.email, loginDto.password)`.
2. Lấy full user từ DB: `usersService.findOne(user.id)`.
3. Gọi `generateTokens(fullUser)`.

### 2.4. Tạo access token (AuthService)

Trong **AuthService.generateAccessToken**:

```ts
private generateAccessToken(user: UserDto | User): string {
  const payload = { email: user.email, sub: user.id, role: user.role };
  return this.jwtService.sign(payload, {
    secret: jwt?.secret || 'your-secret-key',
    expiresIn: jwt?.accessTokenExpiresIn || '15m',
  });
}
```

- **Payload**: `sub` = `user.id`, `email`, `role`.
- **JwtService.sign**: ký bằng `secret` và set thời hạn → chuỗi JWT (access_token).

### 2.5. Response trả về client

```json
{
  "id": "...",
  "email": "user@example.com",
  "firstName": "...",
  "lastName": "...",
  "role": "user",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "..."
}
```

---

## 3. Xác thực JWT khi gửi request (protected route)

### 3.1. Client gửi request kèm JWT

Ví dụ:

```http
GET /auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 3.2. JwtAuthGuard

Route được bảo vệ bằng `@UseGuards(JwtAuthGuard)` (ví dụ `getProfile`):

```ts
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user: User) {
  return user;
}
```

**JwtAuthGuard** (`src/common/guards/jwt-auth.guard.ts`) kế thừa `AuthGuard('jwt')` → Passport chạy strategy tên `'jwt'`, tức **JwtStrategy**.

### 3.3. JwtStrategy (verify token và gán user)

**JwtStrategy** (`src/modules/auth/strategies/jwt.strategy.ts`):

#### Cấu hình (constructor)

- `jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()`: đọc JWT từ header `Authorization: Bearer <token>`.
- `secretOrKey`: cùng `secret` với lúc ký (từ config).
- `ignoreExpiration: false`: không chấp nhận token hết hạn.

#### Quá trình verify

1. Passport-jwt lấy token từ request.
2. Verify chữ ký bằng `secretOrKey`.
3. Kiểm tra `exp` (expiration).
4. Giải mã payload và gọi `validate(payload)`.

#### validate(payload)

```ts
async validate(payload: any) {
  const user = await this.usersService.findOne(payload.sub);
  if (!user || !user.isActive) {
    throw new UnauthorizedException();
  }
  return user;
}
```

- `payload.sub` chính là `user.id` lúc login.
- Lấy user hiện tại từ DB; nếu không tồn tại hoặc `isActive === false` → 401.
- **Giá trị return** của `validate` được Passport gán vào `request.user`.

### 3.4. Controller và CurrentUser

- Guard trả về thành công → request tiếp tục tới controller.
- `@CurrentUser()` (`src/common/decorators/current-user.decorator.ts`) chỉ đọc `request.user`.
- Vì vậy `user` trong `getProfile(@CurrentUser() user: User)` chính là object User từ DB do JwtStrategy trả về.

---

## 4. Bảng tóm tắt

| Giai đoạn | Thành phần | Việc chính |
|-----------|------------|------------|
| **Login** | LocalStrategy | Kiểm tra email/password, gán user lên request. |
| **Trả JWT** | AuthService.generateAccessToken | Tạo payload `{ sub: id, email, role }`, ký bằng JwtService + secret → access_token. |
| **Gửi request** | Client | Gửi header `Authorization: Bearer <access_token>`. |
| **Bảo vệ route** | JwtAuthGuard | Kích hoạt strategy `'jwt'` (JwtStrategy). |
| **Verify JWT** | JwtStrategy (passport-jwt) | Lấy token từ header, verify chữ ký và exp, giải mã payload. |
| **Gán user** | JwtStrategy.validate | Tìm user theo `payload.sub`, kiểm tra tồn tại và isActive, return user → `request.user`. |
| **Dùng user** | @CurrentUser() | Lấy `request.user` trong controller. |

---

## 5. Các file liên quan

| File | Vai trò |
|------|--------|
| `src/modules/auth/auth.module.ts` | Đăng ký JwtModule, JwtStrategy. |
| `src/config/configuration.ts` | Cấu hình jwt (secret, expiresIn). |
| `src/modules/auth/strategies/local.strategy.ts` | Xác thực email/password khi login. |
| `src/modules/auth/strategies/jwt.strategy.ts` | Verify JWT và gán user lên request. |
| `src/modules/auth/services/auth.service.ts` | Login, generateAccessToken, generateTokens. |
| `src/modules/auth/controllers/auth.controller.ts` | Endpoint login, profile, refresh, logout. |
| `src/common/guards/jwt-auth.guard.ts` | Guard bảo vệ route cần JWT. |
| `src/common/decorators/current-user.decorator.ts` | Lấy user từ request trong controller. |

---

## 6. Lưu ý

1. **Cùng secret**: Ký (AuthService) và verify (JwtStrategy) phải dùng cùng `jwt.secret` (config/`.env`).
2. **Bearer token**: JWT luôn gửi trong header `Authorization: Bearer <token>`; JwtStrategy đã cấu hình đúng với `ExtractJwt.fromAuthHeaderAsBearerToken()`.
3. **sub = user id**: `payload.sub` trong JWT là ID user; JwtStrategy dùng nó để load lại user từ DB và kiểm tra `isActive`.
4. **Refresh token**: Dùng cho endpoint `POST /auth/refresh` để lấy access_token mới; không dùng trong JwtStrategy. JwtStrategy chỉ xử lý **access_token** trong header.

---

## 7. Refresh token

- **POST /auth/refresh**: Client gửi `refresh_token` trong body → AuthService validate refresh token, tạo cặp access_token + refresh_token mới, revoke refresh token cũ.
- **POST /auth/logout**: Client gửi `refresh_token` → AuthService revoke refresh token.

Chi tiết refresh token xem trong `AuthService.refreshAccessToken` và `RefreshTokenService`.
