# API Documentation

## Base URL

- Local with Docker (default): `http://localhost:3001/api/v1`
- Local without Docker (default): `http://localhost:3000/api/v1`

## Swagger

When `NODE_ENV != production`:

- `GET /api/docs`

## Authentication

Use bearer token for protected endpoints:

```http
Authorization: Bearer <access_token>
```

Token flow:

1. Login/register to receive `access_token` and `refresh_token`
2. Call `POST /auth/refresh` to rotate/renew access token
3. Call `POST /auth/logout` to revoke refresh token

## Response Convention

Most endpoints return a standardized envelope from global interceptors.

Typical success shape:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Typical error shape:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": []
}
```

## Endpoint Overview

### Auth

- `POST /auth/register` - Register user
- `POST /auth/login` - Login with email/password
- `GET /auth/google` - Start Google OAuth flow
- `GET /auth/google/callback` - Google OAuth callback
- `POST /auth/google/login` - Deprecated (returns 400)
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Revoke refresh token
- `GET /auth/profile` - Current authenticated user

### Users

All `/users/*` endpoints require JWT.

- `POST /users` - Create user (admin)
- `GET /users` - List users (admin)
- `GET /users/profile` - Current user profile
- `PATCH /users/profile` - Update current profile
- `GET /users/:id` - Get user by ID (admin)
- `PATCH /users/:id` - Update user by ID (admin)
- `DELETE /users/:id` - Delete user by ID (admin)

### Admin

All `/admin/*` endpoints require JWT + `ADMIN` role.

Dashboard and settings:

- `GET /admin/dashboard`
- `GET /admin/settings`
- `PUT /admin/settings`

User management:

- `GET /admin/users`
- `GET /admin/users/search`
- `GET /admin/users/:id`
- `POST /admin/users`
- `PATCH /admin/users/:id`
- `DELETE /admin/users/:id`
- `PATCH /admin/users/:id/activate`
- `PATCH /admin/users/:id/deactivate`

### Health

- `GET /health` - Full health check
- `GET /health/db` - Database check
- `GET /health/redis` - Redis check
- `GET /health/memory` - Memory check
- `GET /health/disk` - Disk check

### Internal/Admin Operations (Excluded from Swagger)

Queue endpoints (`ADMIN` only):

- `GET /queue/stats`
- `GET /queue/stats/:queueName`
- `POST /queue/email`
- `POST /queue/notification`
- `DELETE /queue/clean/:queueName`

Storage endpoints:

- `POST /storage/upload` (`USER`/`ADMIN`)
- `POST /storage/upload/multiple` (`USER`/`ADMIN`)
- `GET /storage/files/*` (public file retrieval)
- `GET /storage/info/*` (`USER`/`ADMIN`)
- `GET /storage/list` (`USER`/`ADMIN`)
- `DELETE /storage/files/*` (`ADMIN`)
- `GET /storage/stats` (`ADMIN`)

## Rate Limiting

Throttling is enabled globally with optional endpoint presets.

## Versioning

URI versioning is enabled. Current default version is `v1`.
