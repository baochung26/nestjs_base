# Hướng dẫn Setup Google OAuth

Tài liệu này giả định:
- **Frontend** chạy tại `http://localhost:3000`
- **Backend** (NestJS API) chạy tại `http://localhost:3001`

**Luồng hoạt động chi tiết** (Next.js ↔ NestJS ↔ Google) xem: [GOOGLE_LOGIN_FLOW.md](./GOOGLE_LOGIN_FLOW.md).

---

## Bước 1: Tạo Google OAuth Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo một project mới hoặc chọn project hiện có
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Chọn **Web application**
6. Điền thông tin:
   - **Name**: Tên ứng dụng của bạn (ví dụ: "NestJS Demo App")
   - **Authorized JavaScript origins** (origin của frontend):
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs** (callback do **backend** xử lý, đúng port backend):
     - `http://localhost:3001/api/v1/auth/google/callback` (development)
     - `https://api.yourdomain.com/api/v1/auth/google/callback` (production)
7. Click **Create**
8. Copy **Client ID** và **Client Secret**

## Bước 2: Cập nhật .env

Cập nhật file `.env` với thông tin Google OAuth:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

**Lưu ý:**
- Thay `your-google-client-id` và `your-google-client-secret` bằng giá trị thực từ Google Cloud Console
- `GOOGLE_CALLBACK_URL`: URL **backend** (port 3001) — Google redirect về đây sau khi user đăng nhập. Phải khớp với **Authorized redirect URIs** trong Google Console.
- `FRONTEND_URL`: URL **frontend** (port 3000) — backend redirect về đây với token sau khi xử lý callback.

## Bước 3: Enable Google+ API (nếu cần)

1. Vào **APIs & Services** > **Library**
2. Tìm "Google+ API" hoặc "Google Identity"
3. Click **Enable**

## Cách sử dụng

### 1. Web Application (Redirect Flow)

User truy cập **endpoint backend** để bắt đầu OAuth flow:

```
GET http://localhost:3001/api/v1/auth/google
```

User sẽ được redirect đến Google để đăng nhập. Sau khi đăng nhập thành công, Google redirect về **backend**:

```
GET http://localhost:3001/api/v1/auth/google/callback
```

Backend xử lý callback, tạo hoặc tìm user, rồi redirect về **frontend** với token:

```
http://localhost:3000/auth/callback?access_token=JWT_TOKEN&refresh_token=REFRESH_TOKEN&user=USER_DATA
```

### 2. Frontend Integration

**React Example:**

```typescript
// Login button — chuyển user đến backend (port 3001) để bắt đầu OAuth
const handleGoogleLogin = () => {
  window.location.href = 'http://localhost:3001/api/v1/auth/google';
};

// Callback page (frontend route /auth/callback)
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get('access_token');
  const refreshToken = urlParams.get('refresh_token');
  const user = urlParams.get('user');
  
  if (accessToken) {
    // Lưu token vào localStorage hoặc state management
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    
    // Parse user data
    const userData = JSON.parse(decodeURIComponent(user));
    console.log('User logged in:', userData);
    
    // Redirect to dashboard
    window.location.href = '/dashboard';
  }
}, []);
```

**Vue Example:**

```vue
<template>
  <button @click="loginWithGoogle">Login with Google</button>
</template>

<script>
export default {
  methods: {
    loginWithGoogle() {
      window.location.href = 'http://localhost:3001/api/v1/auth/google';
    },
    mounted() {
      // Handle callback (query: access_token, refresh_token, user)
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      
      if (accessToken) {
        localStorage.setItem('access_token', accessToken);
        this.$router.push('/dashboard');
      }
    }
  }
}
</script>
```

### 3. Mobile Application

Đối với mobile apps, bạn có thể sử dụng Google Sign-In SDK và gửi ID token về backend để verify.

## API Endpoints (Backend — localhost:3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/auth/google` | Bắt đầu Google OAuth flow (redirect đến Google) |
| GET | `/api/v1/auth/google/callback` | Callback từ Google (backend xử lý rồi redirect về frontend) |

## Flow Diagram

```
User clicks "Login with Google" (frontend 3000)
    ↓
Redirect to GET http://localhost:3001/api/v1/auth/google (backend)
    ↓
Backend redirects to Google OAuth
    ↓
User authenticates with Google
    ↓
Google redirects to http://localhost:3001/api/v1/auth/google/callback (backend)
    ↓
Backend validates and creates/finds user, generates JWT
    ↓
Backend redirects to http://localhost:3000/auth/callback?access_token=... (frontend)
    ↓
Frontend saves token and redirects to dashboard
```

Chi tiết từng bước, sơ đồ sequence và ví dụ Next.js: [GOOGLE_LOGIN_FLOW.md](./GOOGLE_LOGIN_FLOW.md).

## Troubleshooting

### Lỗi: "redirect_uri_mismatch"

- Kiểm tra `GOOGLE_CALLBACK_URL` trong `.env` phải khớp với **Authorized redirect URIs** trong Google Cloud Console
- Đảm bảo không có trailing slash hoặc thừa ký tự

### Lỗi: "invalid_client" / "The OAuth client was not found" (Error 401)

Google trả về lỗi này khi **Client ID** hoặc **Client Secret** không hợp lệ hoặc không tồn tại. Làm lần lượt:

1. **Kiểm tra OAuth client còn tồn tại**
   - Vào [Google Cloud Console](https://console.cloud.google.com/) → chọn đúng **project**
   - **APIs & Services** → **Credentials**
   - Tìm mục **OAuth 2.0 Client IDs** → mở client kiểu **Web application** bạn đã tạo
   - Nếu không thấy client nào → tạo mới (Bước 1 trong tài liệu này)

2. **Copy lại Client ID và Client Secret**
   - Trong trang **Credentials**, click vào tên OAuth 2.0 client (Web application)
   - **Client ID**: dạng `xxxxx.apps.googleusercontent.com` — copy nguyên, không thêm khoảng trắng hay dấu ngoặc
   - **Client secret**: click **Show** rồi copy — thường chỉ hiện khi tạo mới; nếu đã mất thì tạo **Client secret mới** (nút reset/regenerate trong cùng trang)

3. **Cập nhật `.env` đúng format**
   ```env
   GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
   ```
   - Không bỏ trong dấu ngoặc kép trừ khi giá trị có khoảng trắng (không nên có)
   - Không có khoảng trắng trước/sau dấu `=`
   - Không xuống dòng giữa chừng trong một giá trị

4. **Restart backend** sau khi sửa `.env` (NestJS đọc env lúc khởi động).

5. **Nếu dùng nhiều project Google Cloud**: đảm bảo Client ID/Secret lấy từ **cùng project** và **OAuth consent screen** của project đó đã được cấu hình (APIs & Services → OAuth consent screen).

### User không được tạo

- Kiểm tra logs của application
- Đảm bảo database connection hoạt động
- Kiểm tra UserService.findOrCreateGoogleUser method

## Security Notes

1. **Never expose Client Secret** - Chỉ sử dụng trong backend
2. **Use HTTPS in production** - OAuth yêu cầu HTTPS cho production
3. **Validate tokens** - Luôn validate JWT tokens trên backend
4. **Set proper CORS** - Cấu hình CORS đúng cho frontend domain
