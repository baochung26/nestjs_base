# Luồng Google Login: Frontend Next.js & Backend NestJS

Tài liệu mô tả luồng hoạt động của đăng nhập Google giữa **Frontend Next.js** (port 3000) và **Backend NestJS** (port 3001). Phần cấu hình (credentials, `.env`) xem [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md).

---

## Tổng quan

| Thành phần | URL (development) | Vai trò |
|------------|--------------------|--------|
| **Frontend (Next.js)** | `http://localhost:3000` | Hiển thị UI, nút "Login with Google", trang callback nhận token |
| **Backend (NestJS)** | `http://localhost:3001` | Khởi tạo OAuth, nhận callback từ Google, tạo/find user, cấp JWT, redirect về frontend |
| **Google OAuth** | `accounts.google.com` | Xác thực user, redirect về backend với authorization code |

**Nguyên tắc:** Client ID & Secret chỉ nằm trên **backend**. Frontend không gọi trực tiếp Google OAuth; user được chuyển qua backend rồi backend redirect đến Google.

---

## Sơ đồ luồng (Sequence)

```
┌──────────┐          ┌──────────┐          ┌──────────┐          ┌──────────┐
│  User    │          │ Next.js  │          │ NestJS   │          │  Google  │
│ (Browser)│          │ :3000    │          │ :3001    │          │  OAuth   │
└────┬─────┘          └────┬─────┘          └────┬─────┘          └────┬─────┘
     │                      │                      │                      │
     │  1. Click "Login      │                      │                      │
     │     with Google"      │                      │                      │
     │─────────────────────>│                      │                      │
     │                      │                      │                      │
     │  2. Redirect 302     │                      │                      │
     │  GET /api/v1/auth/google                    │                      │
     │<─────────────────────│                      │                      │
     │                      │                      │                      │
     │  3. GET backend      │                      │                      │
     │  (start OAuth)       │                      │                      │
     │────────────────────────────────────────────>│                      │
     │                      │                      │                      │
     │  4. Redirect 302     │                      │                      │
     │  → accounts.google.com (login/consent)     │                      │
     │<────────────────────────────────────────────│                      │
     │                      │                      │                      │
     │  5. User đăng nhập Google & đồng ý          │                      │
     │──────────────────────────────────────────────────────────────────>│
     │                      │                      │                      │
     │  6. Redirect 302     │                      │                      │
     │  → backend /api/v1/auth/google/callback?code=...                  │
     │<──────────────────────────────────────────────────────────────────│
     │                      │                      │                      │
     │  7. GET callback     │                      │                      │
     │  (backend đổi code lấy profile, tạo/find user, tạo JWT)           │
     │────────────────────────────────────────────>│                      │
     │                      │                      │                      │
     │  8. Redirect 302     │                      │                      │
     │  → frontend /auth/callback?access_token=...&refresh_token=...&user=...
     │<────────────────────────────────────────────│                      │
     │                      │                      │                      │
     │  9. GET /auth/callback (Next.js)            │                      │
     │─────────────────────>│                      │                      │
     │                      │                      │                      │
     │  10. Lưu token, redirect /dashboard          │                      │
     │<─────────────────────│                      │                      │
     │                      │                      │                      │
```

---

## Chi tiết từng bước

### Bước 1–2: User click login trên Next.js

- **Nơi xảy ra:** Trình duyệt đang ở `http://localhost:3000` (ví dụ trang `/login`).
- **Hành động:** User bấm nút "Login with Google".
- **Frontend (Next.js):** Không gọi API. Thực hiện **redirect** (302) sang URL backend:
  ```
  http://localhost:3001/api/v1/auth/google
  ```
- **Ví dụ code (Next.js):**
  ```tsx
  // app/login/page.tsx hoặc component
  function LoginPage() {
    const handleGoogleLogin = () => {
      window.location.href = 'http://localhost:3001/api/v1/auth/google';
    };
    return <button onClick={handleGoogleLogin}>Login with Google</button>;
  }
  ```

### Bước 3–4: Backend nhận request và redirect đến Google

- **Nơi xảy ra:** NestJS nhận `GET /api/v1/auth/google`.
- **Backend (NestJS):**
  - `AuthController` + `GoogleAuthGuard` (Passport) xử lý.
  - Dùng `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` từ config.
  - Trả về **302** redirect đến `https://accounts.google.com/o/oauth2/v2/auth?...` (scope, client_id, redirect_uri = backend callback, state, ...).
- **Trình duyệt:** Chuyển sang trang đăng nhập/đồng ý của Google.

### Bước 5–6: User đăng nhập Google, Google redirect về backend

- **Nơi xảy ra:** Trên Google, user đăng nhập (hoặc đã đăng nhập) và đồng ý quyền (email, profile).
- **Google:** Sau khi xác thực thành công, redirect (302) về **Authorized redirect URI** đã cấu hình, tức URL **backend**:
  ```
  http://localhost:3001/api/v1/auth/google/callback?code=AUTHORIZATION_CODE&scope=...&state=...
  ```
- **Lưu ý:** Redirect URI phải khớp chính xác với cấu hình trong Google Cloud Console và với `GOOGLE_CALLBACK_URL` trong `.env` backend (xem [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)).

### Bước 7: Backend xử lý callback

- **Nơi xảy ra:** NestJS nhận `GET /api/v1/auth/google/callback?code=...`.
- **Backend (NestJS):**
  1. **GoogleAuthGuard** đổi `code` lấy access token từ Google (server-side).
  2. Dùng access token lấy thông tin profile (email, name, picture).
  3. **AuthService.googleLogin()**: tìm hoặc tạo user trong DB (theo email), tạo cặp JWT (access_token, refresh_token).
  4. Trả về **302** redirect sang **frontend** với token trên query:
     ```
     http://localhost:3000/auth/callback?access_token=JWT_ACCESS&refresh_token=JWT_REFRESH&user=ENCODED_JSON
     ```
- **FRONTEND_URL** trong `.env` backend quyết định domain/path redirect (development: `http://localhost:3000`).

### Bước 8–10: Frontend nhận token và hoàn tất đăng nhập

- **Nơi xảy ra:** Trình duyệt mở `http://localhost:3000/auth/callback?access_token=...&refresh_token=...&user=...`.
- **Frontend (Next.js):**
  1. Trang callback (ví dụ `app/auth/callback/page.tsx`) đọc query: `access_token`, `refresh_token`, `user`.
  2. Lưu token (cookie, localStorage, hoặc state) theo cách bạn chọn.
  3. Decode/parse `user` nếu cần (backend gửi dạng `encodeURIComponent(JSON.stringify(result))`).
  4. Redirect user vào trang chính (ví dụ `/dashboard`).
- **Ví dụ code (Next.js App Router):**
  ```tsx
  // app/auth/callback/page.tsx
  'use client';
  import { useSearchParams, useRouter } from 'next/navigation';
  import { useEffect } from 'react';

  export default function AuthCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const user = searchParams.get('user');

      if (accessToken) {
        // Lưu token (ví dụ localStorage hoặc httpOnly cookie)
        localStorage.setItem('access_token', accessToken);
        if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
        if (user) {
          try {
            const userData = JSON.parse(decodeURIComponent(user));
            // Có thể lưu user vào state/context
          } catch (e) {}
        }
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }, [searchParams, router]);

    return <div>Đang xử lý đăng nhập...</div>;
  }
  ```

---

## URL và endpoint tóm tắt

| Bước | Ai thực hiện | URL / Hành động |
|------|--------------|------------------|
| Bắt đầu OAuth | Next.js redirect user | `GET http://localhost:3001/api/v1/auth/google` |
| Google xác thực | Trình duyệt | `https://accounts.google.com/...` (do backend redirect) |
| Callback từ Google | Google redirect | `GET http://localhost:3001/api/v1/auth/google/callback?code=...` |
| Redirect về frontend | NestJS redirect | `GET http://localhost:3000/auth/callback?access_token=...&refresh_token=...&user=...` |
| Lưu token & vào app | Next.js | Đọc query → lưu token → redirect `/dashboard` (hoặc trang chính) |

---

## Phân trách trách nhiệm

| Nội dung | Frontend (Next.js) | Backend (NestJS) |
|---------|--------------------|------------------|
| Client ID / Secret | Không giữ, không dùng | Giữ trong `.env`, dùng để nói chuyện với Google |
| Bắt đầu OAuth | Chỉ redirect user đến backend `/api/v1/auth/google` | Nhận request, redirect đến Google |
| Nhận callback từ Google | Không | Nhận tại `/api/v1/auth/google/callback`, đổi code lấy profile |
| Tạo/find user & JWT | Không | AuthService.googleLogin(), trả JWT qua redirect |
| Lưu token, bảo vệ route | Có (lưu token, gửi kèm request sau này) | Cung cấp API bảo vệ bằng JWT (Bearer) |

---

## Liên quan với tài liệu khác

- **Cấu hình Google OAuth, `.env`, Troubleshooting:** [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)
- **API Auth (login, refresh, profile):** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) (phần auth)

Sau khi đăng nhập Google thành công, frontend dùng `access_token` trong header `Authorization: Bearer <access_token>` cho các request tới NestJS. Khi access_token hết hạn, gọi `POST /api/v1/auth/refresh` với `refresh_token` để lấy access_token mới.
