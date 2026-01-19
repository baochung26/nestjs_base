# Hướng dẫn Setup Google OAuth

## Bước 1: Tạo Google OAuth Credentials

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo một project mới hoặc chọn project hiện có
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Chọn **Web application**
6. Điền thông tin:
   - **Name**: Tên ứng dụng của bạn (ví dụ: "NestJS Demo App")
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/google/callback` (development)
     - `https://yourdomain.com/api/auth/google/callback` (production)
7. Click **Create**
8. Copy **Client ID** và **Client Secret**

## Bước 2: Cập nhật .env

Cập nhật file `.env` với thông tin Google OAuth:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
FRONTEND_URL=http://localhost:3001
```

**Lưu ý:**
- Thay `your-google-client-id` và `your-google-client-secret` bằng giá trị thực từ Google Cloud Console
- `FRONTEND_URL` là URL của frontend application, nơi sẽ nhận token sau khi login thành công

## Bước 3: Enable Google+ API (nếu cần)

1. Vào **APIs & Services** > **Library**
2. Tìm "Google+ API" hoặc "Google Identity"
3. Click **Enable**

## Cách sử dụng

### 1. Web Application (Redirect Flow)

User truy cập endpoint để bắt đầu OAuth flow:

```
GET /api/auth/google
```

User sẽ được redirect đến Google để đăng nhập. Sau khi đăng nhập thành công, Google sẽ redirect về:

```
GET /api/auth/google/callback
```

Backend sẽ tự động tạo hoặc tìm user và redirect về frontend với token:

```
http://localhost:3001/auth/callback?token=JWT_TOKEN&user=USER_DATA
```

### 2. Frontend Integration

**React Example:**

```typescript
// Login button
const handleGoogleLogin = () => {
  window.location.href = 'http://localhost:3000/api/auth/google';
};

// Callback page
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const user = urlParams.get('user');
  
  if (token) {
    // Lưu token vào localStorage hoặc state management
    localStorage.setItem('access_token', token);
    
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
      window.location.href = 'http://localhost:3000/api/auth/google';
    },
    mounted() {
      // Handle callback
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (token) {
        localStorage.setItem('access_token', token);
        this.$router.push('/dashboard');
      }
    }
  }
}
</script>
```

### 3. Mobile Application

Đối với mobile apps, bạn có thể sử dụng Google Sign-In SDK và gửi ID token về backend để verify.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Bắt đầu Google OAuth flow |
| GET | `/api/auth/google/callback` | Callback từ Google (tự động redirect) |

## Flow Diagram

```
User clicks "Login with Google"
    ↓
GET /api/auth/google
    ↓
Redirect to Google OAuth
    ↓
User authenticates with Google
    ↓
Google redirects to /api/auth/google/callback
    ↓
Backend validates and creates/finds user
    ↓
Backend generates JWT token
    ↓
Redirect to frontend with token
    ↓
Frontend saves token and redirects to dashboard
```

## Troubleshooting

### Lỗi: "redirect_uri_mismatch"

- Kiểm tra `GOOGLE_CALLBACK_URL` trong `.env` phải khớp với **Authorized redirect URIs** trong Google Cloud Console
- Đảm bảo không có trailing slash hoặc thừa ký tự

### Lỗi: "invalid_client"

- Kiểm tra `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` trong `.env`
- Đảm bảo đã copy đúng từ Google Cloud Console

### User không được tạo

- Kiểm tra logs của application
- Đảm bảo database connection hoạt động
- Kiểm tra UserService.findOrCreateGoogleUser method

## Security Notes

1. **Never expose Client Secret** - Chỉ sử dụng trong backend
2. **Use HTTPS in production** - OAuth yêu cầu HTTPS cho production
3. **Validate tokens** - Luôn validate JWT tokens trên backend
4. **Set proper CORS** - Cấu hình CORS đúng cho frontend domain
