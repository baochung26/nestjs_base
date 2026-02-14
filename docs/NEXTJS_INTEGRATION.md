# Hướng dẫn tích hợp Next.js Frontend với NestJS API

## 🔌 API Endpoint cho Login

### Route Login

**URL:** `POST /api/v1/auth/login`

**Base URL:** `http://localhost:3001` (hoặc domain của bạn)

**Full URL:** `http://localhost:3001/api/v1/auth/login`

## 📤 Request Format

### Headers

```typescript
Content-Type: application/json
```

### Request Body

```typescript
{
  "email": "user@example.com",
  "password": "user123"
}
```

### Validation

- `email`: Phải là email hợp lệ (IsEmail)
- `password`: Phải là string (IsString)

## 📥 Response Format

### Login Thành Công (200 OK)

Response sẽ được wrap bởi `TransformInterceptor` theo format chuẩn:

```typescript
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user", // hoặc "admin"
    "isActive": true,
    "createdAt": "2026-01-20T10:00:00.000Z",
    "updatedAt": "2026-01-20T10:00:00.000Z",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2026-01-20T14:50:41.074Z",
  "path": "/api/v1/auth/login"
}
```

### Login Thất Bại (401 Unauthorized)

```typescript
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid email or password",
  "timestamp": "2026-01-20T14:50:41.074Z",
  "path": "/api/v1/auth/login"
}
```

### Validation Error (400 Bad Request)

```typescript
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": [
    "email must be an email",
    "password must be a string"
  ],
  "timestamp": "2026-01-20T14:50:41.074Z",
  "path": "/api/v1/auth/login"
}
```

## 💻 Next.js Implementation

### 1. Tạo API Client

Tạo file `lib/api-client.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  timestamp: string;
  path?: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  error?: string | string[];
  timestamp: string;
  path: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw error;
    }

    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
```

### 2. Tạo Auth Service

Tạo file `lib/auth.ts`:

```typescript
import { apiClient, ApiResponse } from './api-client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  access_token: string;
}

export const authService = {
  /**
   * Login với email và password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response: ApiResponse<LoginResponse> = await apiClient.post(
      '/api/v1/auth/login',
      credentials,
    );

    if (response.success && response.data) {
      // Lưu token vào localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    }

    throw new Error(response.message || 'Login failed');
  },

  /**
   * Logout
   */
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Lấy user hiện tại từ localStorage
   */
  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        // Remove access_token từ user object
        const { access_token, ...userData } = user;
        return userData;
      }
    }
    return null;
  },

  /**
   * Lấy access token
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  },

  /**
   * Kiểm tra user đã đăng nhập chưa
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  },
};
```

### 3. Tạo Login Page

Tạo file `app/login/page.tsx` (App Router) hoặc `pages/login.tsx` (Pages Router):

#### App Router (`app/login/page.tsx`):

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import type { ApiError } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await authService.login({ email, password });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      // Handle error
      if (err.statusCode === 401) {
        setError('Email hoặc mật khẩu không đúng');
      } else if (err.statusCode === 400) {
        const errorMsg = Array.isArray(err.error)
          ? err.error.join(', ')
          : err.error || 'Validation failed';
        setError(errorMsg);
      } else {
        setError(err.message || 'Đăng nhập thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center">Đăng nhập</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

#### Pages Router (`pages/login.tsx`):

```typescript
import { useState } from 'react';
import { useRouter } from 'next/router';
import { authService } from '../lib/auth';
import type { ApiError } from '../lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await authService.login({ email, password });
      router.push('/dashboard');
    } catch (err: any) {
      if (err.statusCode === 401) {
        setError('Email hoặc mật khẩu không đúng');
      } else if (err.statusCode === 400) {
        const errorMsg = Array.isArray(err.error)
          ? err.error.join(', ')
          : err.error || 'Validation failed';
        setError(errorMsg);
      } else {
        setError(err.message || 'Đăng nhập thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  // ... rest of the component (same as above)
}
```

### 4. Tạo Protected Route Middleware

Tạo file `middleware.ts` (App Router) hoặc `middleware/auth.ts` (Pages Router):

#### App Router (`middleware.ts`):

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/admin'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### 5. Sử dụng trong Component

```typescript
'use client';

import { useEffect, useState } from 'react';
import { authService, type User } from '@/lib/auth';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.firstName} {user.lastName}!</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

## 🔐 Sử dụng Token cho các Request khác

Sau khi login thành công, token được lưu trong localStorage. API client sẽ tự động thêm token vào header:

```typescript
// Tự động thêm Authorization header
const response = await apiClient.get('/api/v1/users/profile');
```

## 📝 Environment Variables

Thêm vào `.env.local` của Next.js:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🧪 Test với cURL

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "user123"
  }'
```

## 📚 Các Endpoint khác

### Register

```typescript
POST / api / v1 / auth / register;
Body: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
```

### Get Profile

```typescript
GET / api / v1 / auth / profile;
Headers: {
  Authorization: 'Bearer <access_token>';
}
```

### Get Users

```typescript
GET / api / v1 / users;
Headers: {
  Authorization: 'Bearer <access_token>';
}
```

## ⚠️ Lưu ý

1. **Token Expiry**: Token mặc định có thời hạn 7 ngày (có thể cấu hình trong `.env`)
2. **CORS**: Đảm bảo backend đã cấu hình CORS cho frontend domain
3. **HTTPS**: Trong production, sử dụng HTTPS và httpOnly cookies thay vì localStorage
4. **Error Handling**: Luôn xử lý các trường hợp lỗi (401, 400, 500, etc.)
