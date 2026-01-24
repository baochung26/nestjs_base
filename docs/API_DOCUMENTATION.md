# API Documentation

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
  - [App](#app)
  - [Authentication](#authentication-endpoints)
  - [Users](#users)
  - [Admin](#admin)
  - [Queue](#queue)
  - [Storage](#storage)
  - [Health](#health)

## 🎯 Tổng quan

API này sử dụng:
- **Base Path:** `/api/v1`
- **Versioning:** URI-based (`/api/v1`)
- **Content-Type:** `application/json`
- **Authentication:** JWT Bearer Token
- **Rate Limiting:** Có áp dụng (trừ health checks)

## 🌐 Base URL

```
Development: http://localhost:3000/api/v1
Production: https://yourdomain.com/api/v1
```

## 🔐 Authentication

Hầu hết các endpoints yêu cầu JWT authentication. Gửi token trong header:

```
Authorization: Bearer <your-jwt-token>
```

### Lấy Token

1. **Register:** `POST /api/v1/auth/register`
2. **Login:** `POST /api/v1/auth/login`
3. **Google OAuth:** `GET /api/v1/auth/google`

## 📦 Response Format

### Success Response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-24T12:00:00.000Z",
  "path": "/api/v1/users"
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "timestamp": "2024-01-24T12:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

## ⚠️ Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation errors)
- `401` - Unauthorized (Missing or invalid token)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `409` - Conflict (Duplicate resource)
- `500` - Internal Server Error

### Common Errors

| Status Code | Message | Description |
|------------|---------|-------------|
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User doesn't have required role |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists (e.g., duplicate email) |

---

## 📡 API Endpoints

## App

### Get API Information

**GET** `/api/v1`

Lấy thông tin tổng quan về API.

**Authentication:** Không cần

**Response:**

```json
{
  "success": true,
  "message": "NestJS API is running",
  "version": "1.0.0",
  "endpoints": {
    "v1": "/api/v1",
    "health": "/api/v1/health",
    "auth": "/api/v1/auth",
    "users": "/api/v1/users",
    "admin": "/api/v1/admin"
  },
  "documentation": "See README.md for API documentation"
}
```

### Get API Root

**GET** `/api/v1/api`

Lấy thông tin chi tiết về các endpoints có sẵn.

**Authentication:** Không cần

**Response:**

```json
{
  "success": true,
  "message": "Welcome to NestJS API",
  "version": "1.0.0",
  "baseUrl": "/api/v1",
  "endpoints": {
    "health": "/api/v1/health",
    "auth": {
      "register": "POST /api/v1/auth/register",
      "login": "POST /api/v1/auth/login",
      "profile": "GET /api/v1/auth/profile"
    },
    "users": {
      "list": "GET /api/v1/users",
      "get": "GET /api/v1/users/:id",
      "create": "POST /api/v1/users",
      "update": "PATCH /api/v1/users/:id",
      "delete": "DELETE /api/v1/users/:id"
    },
    "admin": {
      "dashboard": "GET /api/v1/admin/dashboard",
      "users": "GET /api/v1/admin/users",
      "settings": "GET /api/v1/admin/settings"
    }
  }
}
```

---

## Authentication Endpoints

### Register

**POST** `/api/v1/auth/register`

Đăng ký user mới.

**Authentication:** Không cần

**Rate Limit:** 10 requests per 10 seconds

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Validation:**
- `email`: Required, must be valid email
- `password`: Required, minimum 6 characters
- `firstName`: Required, string
- `lastName`: Required, string

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-24T12:00:00.000Z",
    "updatedAt": "2024-01-24T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Validation failed
- `409`: Email already exists

---

### Login

**POST** `/api/v1/auth/login`

Đăng nhập với email và password.

**Authentication:** Không cần (sử dụng LocalAuthGuard)

**Rate Limit:** 10 requests per 10 seconds

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Validation:**
- `email`: Required, must be valid email
- `password`: Required, string

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true
    }
  }
}
```

**Error Responses:**
- `400`: Validation failed
- `401`: Invalid credentials

---

### Google OAuth - Initiate

**GET** `/api/v1/auth/google`

Bắt đầu Google OAuth flow. Redirects to Google login page.

**Authentication:** Không cần

**Response:** Redirect to Google OAuth

**Usage:**
```
GET /api/v1/auth/google
→ Redirects to Google
→ User authenticates
→ Redirects to /api/v1/auth/google/callback
```

---

### Google OAuth - Callback

**GET** `/api/v1/auth/google/callback`

Callback endpoint từ Google OAuth. Tự động redirect về frontend với token.

**Authentication:** Không cần (handled by GoogleAuthGuard)

**Response:** Redirect to frontend with token

**Redirect URL Format:**
```
{FRONTEND_URL}/auth/callback?token={jwt_token}&user={encoded_user_data}
```

---

### Get Profile

**GET** `/api/v1/auth/profile`

Lấy thông tin profile của user hiện tại.

**Authentication:** Required (JWT)

**Response (200):**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "isActive": true,
  "createdAt": "2024-01-24T12:00:00.000Z",
  "updatedAt": "2024-01-24T12:00:00.000Z"
}
```

**Error Responses:**
- `401`: Unauthorized

---

## Users

Tất cả endpoints trong section này yêu cầu **JWT Authentication**.

### Get All Users

**GET** `/api/v1/users`

Lấy danh sách tất cả users.

**Authentication:** Required (JWT)

**Query Parameters:** Không có

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-24T12:00:00.000Z",
      "updatedAt": "2024-01-24T12:00:00.000Z"
    }
  ]
}
```

---

### Get User Profile

**GET** `/api/v1/users/profile`

Lấy thông tin profile của user hiện tại (từ JWT token).

**Authentication:** Required (JWT)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User retrieved successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-24T12:00:00.000Z",
    "updatedAt": "2024-01-24T12:00:00.000Z"
  }
}
```

---

### Get User by ID

**GET** `/api/v1/users/:id`

Lấy thông tin user theo ID.

**Authentication:** Required (JWT)

**Path Parameters:**
- `id` (string): User ID (UUID)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User retrieved successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-24T12:00:00.000Z",
    "updatedAt": "2024-01-24T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `404`: User not found

---

### Create User

**POST** `/api/v1/users`

Tạo user mới.

**Authentication:** Required (JWT)

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "user"
}
```

**Validation:**
- `email`: Required, must be valid email
- `password`: Required, minimum 6 characters
- `firstName`: Required, string
- `lastName`: Required, string
- `role`: Optional, enum: `"user"` | `"admin"` (default: `"user"`)

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-24T12:00:00.000Z",
    "updatedAt": "2024-01-24T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Validation failed
- `409`: Email already exists

---

### Update User

**PATCH** `/api/v1/users/:id`

Cập nhật thông tin user.

**Authentication:** Required (JWT)

**Path Parameters:**
- `id` (string): User ID (UUID)

**Request Body:** (Tất cả fields đều optional)

```json
{
  "firstName": "Updated Name",
  "lastName": "Updated Last",
  "email": "updated@example.com",
  "password": "newpassword123",
  "role": "admin",
  "isActive": true
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User updated successfully",
  "data": {
    "id": "uuid",
    "email": "updated@example.com",
    "firstName": "Updated Name",
    "lastName": "Updated Last",
    "role": "admin",
    "isActive": true,
    "createdAt": "2024-01-24T12:00:00.000Z",
    "updatedAt": "2024-01-24T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Validation failed
- `404`: User not found
- `409`: Email already exists (if updating email)

---

### Delete User

**DELETE** `/api/v1/users/:id`

Xóa user.

**Authentication:** Required (JWT)

**Path Parameters:**
- `id` (string): User ID (UUID)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User deleted successfully"
}
```

**Error Responses:**
- `404`: User not found

---

## Admin

Tất cả endpoints trong section này yêu cầu:
- **JWT Authentication**
- **Admin Role** (`role: "admin"`)

### Dashboard - Get Statistics

**GET** `/api/v1/admin/dashboard`

Lấy thống kê tổng quan cho admin dashboard.

**Authentication:** Required (JWT + Admin Role)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Statistics retrieved successfully",
  "data": {
    "overview": {
      "totalUsers": 100,
      "activeUsers": 85,
      "inactiveUsers": 15,
      "adminUsers": 5,
      "regularUsers": 95
    },
    "recentUsers": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "user",
        "createdAt": "2024-01-24T12:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**
- `401`: Unauthorized
- `403`: Forbidden (not admin)

---

### Admin Users - Get All Users

**GET** `/api/v1/admin/users`

Lấy danh sách tất cả users (admin view).

**Authentication:** Required (JWT + Admin Role)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-24T12:00:00.000Z",
      "updatedAt": "2024-01-24T12:00:00.000Z"
    }
  ]
}
```

---

### Admin Users - Get User by ID

**GET** `/api/v1/admin/users/:id`

Lấy thông tin chi tiết user (admin view).

**Authentication:** Required (JWT + Admin Role)

**Path Parameters:**
- `id` (string): User ID (UUID)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User retrieved successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-24T12:00:00.000Z",
    "updatedAt": "2024-01-24T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `404`: User not found

---

### Admin Users - Create User

**POST** `/api/v1/admin/users`

Tạo user mới (admin only).

**Authentication:** Required (JWT + Admin Role)

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "user"
}
```

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-01-24T12:00:00.000Z",
    "updatedAt": "2024-01-24T12:00:00.000Z"
  }
}
```

---

### Admin Users - Update User

**PATCH** `/api/v1/admin/users/:id`

Cập nhật user (admin only).

**Authentication:** Required (JWT + Admin Role)

**Path Parameters:**
- `id` (string): User ID (UUID)

**Request Body:** (Tất cả fields đều optional)

```json
{
  "firstName": "Updated Name",
  "lastName": "Updated Last",
  "email": "updated@example.com",
  "password": "newpassword123",
  "role": "admin",
  "isActive": true
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User updated successfully",
  "data": {
    "id": "uuid",
    "email": "updated@example.com",
    "firstName": "Updated Name",
    "lastName": "Updated Last",
    "role": "admin",
    "isActive": true,
    "createdAt": "2024-01-24T12:00:00.000Z",
    "updatedAt": "2024-01-24T12:00:00.000Z"
  }
}
```

---

### Admin Users - Delete User

**DELETE** `/api/v1/admin/users/:id`

Xóa user (admin only).

**Authentication:** Required (JWT + Admin Role)

**Path Parameters:**
- `id` (string): User ID (UUID)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User deleted successfully"
}
```

---

### Admin Users - Activate User

**PATCH** `/api/v1/admin/users/:id/activate`

Kích hoạt user (set `isActive: true`).

**Authentication:** Required (JWT + Admin Role)

**Path Parameters:**
- `id` (string): User ID (UUID)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User activated successfully",
  "data": {
    "id": "uuid",
    "isActive": true
  }
}
```

---

### Admin Users - Deactivate User

**PATCH** `/api/v1/admin/users/:id/deactivate`

Vô hiệu hóa user (set `isActive: false`).

**Authentication:** Required (JWT + Admin Role)

**Path Parameters:**
- `id` (string): User ID (UUID)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User deactivated successfully",
  "data": {
    "id": "uuid",
    "isActive": false
  }
}
```

---

### Admin Settings - Get Settings

**GET** `/api/v1/admin/settings`

Lấy cấu hình hệ thống.

**Authentication:** Required (JWT + Admin Role)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Settings retrieved successfully",
  "data": {
    "appName": "NestJS Demo",
    "version": "1.0.0",
    "environment": "development",
    "database": {
      "host": "postgres",
      "port": 5432,
      "name": "nestjs_db"
    },
    "jwt": {
      "expiresIn": "7d"
    }
  }
}
```

---

### Admin Settings - Update Settings

**PUT** `/api/v1/admin/settings`

Cập nhật cấu hình hệ thống.

**Authentication:** Required (JWT + Admin Role)

**Request Body:**

```json
{
  "appName": "My App",
  "version": "1.0.1",
  "environment": "production"
}
```

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Settings updated successfully",
  "data": {
    "message": "Settings updated successfully",
    "settings": {
      "appName": "My App",
      "version": "1.0.1",
      "environment": "production"
    }
  }
}
```

---

## Queue

Tất cả endpoints trong section này yêu cầu:
- **JWT Authentication**
- **Admin Role**

### Get All Queues Statistics

**GET** `/api/v1/queue/stats`

Lấy thống kê tất cả queues.

**Authentication:** Required (JWT + Admin Role)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Queue statistics retrieved successfully",
  "data": {
    "email": {
      "waiting": 5,
      "active": 2,
      "completed": 100,
      "failed": 3,
      "delayed": 0
    },
    "notification": {
      "waiting": 10,
      "active": 1,
      "completed": 200,
      "failed": 5,
      "delayed": 0
    }
  }
}
```

---

### Get Queue Statistics

**GET** `/api/v1/queue/stats/:queueName`

Lấy thống kê queue cụ thể.

**Authentication:** Required (JWT + Admin Role)

**Path Parameters:**
- `queueName` (string): Queue name (e.g., `"email"`, `"notification"`)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Queue statistics retrieved successfully",
  "data": {
    "waiting": 5,
    "active": 2,
    "completed": 100,
    "failed": 3,
    "delayed": 0
  }
}
```

---

### Add Email Job

**POST** `/api/v1/queue/email`

Thêm email job vào queue.

**Authentication:** Required (JWT + Admin Role)

**Request Body:**

```json
{
  "to": "user@example.com",
  "subject": "Welcome Email",
  "template": "welcome",
  "data": {
    "name": "John Doe",
    "verificationLink": "https://example.com/verify"
  }
}
```

**Validation:**
- `to`: Required, valid email
- `subject`: Required, string
- `template`: Optional, string
- `data`: Optional, object

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Email job added successfully",
  "data": {
    "message": "Email job added successfully",
    "jobId": "job-id-123"
  }
}
```

---

### Add Notification Job

**POST** `/api/v1/queue/notification`

Thêm notification job vào queue.

**Authentication:** Required (JWT + Admin Role)

**Request Body:**

```json
{
  "userId": "user-uuid",
  "type": "info",
  "message": "You have a new message",
  "data": {
    "link": "/messages/123"
  }
}
```

**Validation:**
- `userId`: Required, string (UUID)
- `type`: Required, string
- `message`: Required, string
- `data`: Optional, object

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Notification job added successfully",
  "data": {
    "message": "Notification job added successfully",
    "jobId": "job-id-456"
  }
}
```

---

### Clean Queue

**DELETE** `/api/v1/queue/clean/:queueName`

Dọn dẹp completed hoặc failed jobs trong queue.

**Authentication:** Required (JWT + Admin Role)

**Path Parameters:**
- `queueName` (string): Queue name

**Request Body:**

```json
{
  "type": "completed",
  "grace": 1000
}
```

**Validation:**
- `type`: Optional, enum: `"completed"` | `"failed"` (default: `"completed"`)
- `grace`: Optional, number (milliseconds, default: 1000)

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cleaned completed jobs from email queue"
}
```

---

## Storage

### Upload Single File

**POST** `/api/v1/storage/upload`

Upload một file.

**Authentication:** Required (JWT + User/Admin Role)

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` (File): File to upload (required)
- `subfolder` (Query Parameter, optional): Subfolder path

**Query Parameters:**
- `subfolder` (string, optional): Subfolder to store file

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "File uploaded successfully",
  "data": {
    "message": "File uploaded successfully",
    "file": {
      "filename": "generated-filename.jpg",
      "originalName": "photo.jpg",
      "mimetype": "image/jpeg",
      "size": 102400,
      "path": "/uploads/photo.jpg",
      "url": "/api/v1/storage/files/photo.jpg"
    }
  }
}
```

**Error Responses:**
- `400`: No file uploaded
- `400`: Invalid file type
- `400`: File too large

---

### Upload Multiple Files

**POST** `/api/v1/storage/upload/multiple`

Upload nhiều files (tối đa 10 files).

**Authentication:** Required (JWT + User/Admin Role)

**Content-Type:** `multipart/form-data`

**Form Data:**
- `files` (File[]): Files to upload (required, max 10)
- `subfolder` (Query Parameter, optional): Subfolder path

**Query Parameters:**
- `subfolder` (string, optional): Subfolder to store files

**Response (201):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Files uploaded successfully",
  "data": {
    "message": "Files uploaded successfully",
    "files": [
      {
        "filename": "file1.jpg",
        "originalName": "photo1.jpg",
        "mimetype": "image/jpeg",
        "size": 102400,
        "path": "/uploads/photo1.jpg",
        "url": "/api/v1/storage/files/photo1.jpg"
      }
    ]
  }
}
```

---

### Get File (Public)

**GET** `/api/v1/storage/files/*`

Lấy file (public access, không cần authentication).

**Authentication:** Không cần

**Path:** Wildcard path (e.g., `/api/v1/storage/files/photo.jpg` or `/api/v1/storage/files/subfolder/photo.jpg`)

**Response:** File content with appropriate Content-Type header

**Example:**
```
GET /api/v1/storage/files/photo.jpg
→ Returns image file
```

---

### Get File Info

**GET** `/api/v1/storage/info/*`

Lấy thông tin file.

**Authentication:** Required (JWT + User/Admin Role)

**Path:** Wildcard path

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "File info retrieved successfully",
  "data": {
    "filename": "photo.jpg",
    "originalName": "photo.jpg",
    "mimetype": "image/jpeg",
    "size": 102400,
    "path": "/uploads/photo.jpg",
    "url": "/api/v1/storage/files/photo.jpg",
    "createdAt": "2024-01-24T12:00:00.000Z"
  }
}
```

---

### List Files

**GET** `/api/v1/storage/list`

Liệt kê tất cả files.

**Authentication:** Required (JWT + User/Admin Role)

**Query Parameters:**
- `subfolder` (string, optional): Filter by subfolder

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Files listed successfully",
  "data": {
    "files": [
      {
        "filename": "photo.jpg",
        "originalName": "photo.jpg",
        "mimetype": "image/jpeg",
        "size": 102400,
        "path": "/uploads/photo.jpg",
        "url": "/api/v1/storage/files/photo.jpg"
      }
    ],
    "count": 1
  }
}
```

---

### Delete File

**DELETE** `/api/v1/storage/files/*`

Xóa file.

**Authentication:** Required (JWT + Admin Role)

**Path:** Wildcard path

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "File deleted successfully"
}
```

---

### Get Storage Statistics

**GET** `/api/v1/storage/stats`

Lấy thống kê storage.

**Authentication:** Required (JWT + Admin Role)

**Query Parameters:**
- `subfolder` (string, optional): Filter by subfolder

**Response (200):**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Storage statistics retrieved successfully",
  "data": {
    "totalFiles": 100,
    "totalSize": 10485760,
    "totalSizeFormatted": "10 MB",
    "filesByType": {
      "image/jpeg": 50,
      "image/png": 30,
      "application/pdf": 20
    }
  }
}
```

---

## Health

Tất cả health endpoints **không cần authentication** và **không bị rate limit**.

### Health Check (All)

**GET** `/api/v1/health`

Kiểm tra health của tất cả services.

**Authentication:** Không cần

**Response (200):**

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    },
    "storage": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up",
      "message": "Used: 50MB, Available: 200MB"
    },
    "memory_rss": {
      "status": "up",
      "message": "Used: 100MB, Available: 400MB"
    },
    "storage": {
      "status": "up",
      "message": "Disk usage: 50%"
    }
  }
}
```

**Response (503) - Nếu có service down:**

```json
{
  "status": "error",
  "info": {},
  "error": {
    "database": {
      "status": "down",
      "message": "Connection timeout"
    }
  },
  "details": {
    "database": {
      "status": "down",
      "message": "Connection timeout"
    }
  }
}
```

---

### Health Check - Database

**GET** `/api/v1/health/db`

Kiểm tra health của database.

**Authentication:** Không cần

**Response (200):**

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

---

### Health Check - Redis

**GET** `/api/v1/health/redis`

Kiểm tra health của Redis.

**Authentication:** Không cần

**Response (200):**

```json
{
  "status": "ok",
  "info": {
    "redis": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "redis": {
      "status": "up"
    }
  }
}
```

---

### Health Check - Memory

**GET** `/api/v1/health/memory`

Kiểm tra health của memory.

**Authentication:** Không cần

**Response (200):**

```json
{
  "status": "ok",
  "info": {
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "memory_heap": {
      "status": "up",
      "message": "Used: 50MB, Available: 200MB"
    },
    "memory_rss": {
      "status": "up",
      "message": "Used: 100MB, Available: 400MB"
    }
  }
}
```

---

### Health Check - Disk

**GET** `/api/v1/health/disk`

Kiểm tra health của disk storage.

**Authentication:** Không cần

**Response (200):**

```json
{
  "status": "ok",
  "info": {
    "storage": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "storage": {
      "status": "up",
      "message": "Disk usage: 50%"
    }
  }
}
```

---

## 📝 Notes

### Rate Limiting

- **Auth endpoints** (register, login): 10 requests per 10 seconds
- **Other endpoints**: Default rate limit (100 requests per minute)
- **Health endpoints**: No rate limiting

### Pagination

Hiện tại các list endpoints chưa có pagination. Sẽ được thêm trong tương lai.

### Filtering & Sorting

Hiện tại các list endpoints chưa có filtering và sorting. Sẽ được thêm trong tương lai.

### File Upload Limits

- **Max file size:** 10MB (configurable via `STORAGE_MAX_FILE_SIZE`)
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/gif`, `application/pdf`, `text/plain` (configurable)
- **Max files per request:** 10 files (for multiple upload)

---

## 🔗 Tài liệu liên quan

- [API Response Format](./API_RESPONSE_FORMAT.md)
- [Next.js Integration](./NEXTJS_INTEGRATION.md)
- [CORS Configuration](./CORS_CONFIG_GUIDE.md)
- [Environment Variables](./ENV_VALIDATION_GUIDE.md)

---

**Last Updated:** 2024-01-24
