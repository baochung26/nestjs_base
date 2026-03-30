# Google Login Flow

This document explains the OAuth flow between frontend and backend.

## Components

- Frontend (example): `http://localhost:3000`
- Backend API: `http://localhost:3001/api/v1`
- Google OAuth provider

## Flow Steps

1. User clicks **Login with Google** on frontend.
2. Frontend redirects user to backend endpoint: `GET /auth/google`.
3. Backend (Google guard) redirects user to Google consent screen.
4. Google redirects back to backend callback: `GET /auth/google/callback`.
5. Backend validates profile, creates/updates user, issues JWT + refresh token.
6. Backend redirects to frontend callback route:
   - `${FRONTEND_URL}/auth/callback?access_token=...&refresh_token=...&user=...`
7. Frontend stores tokens and starts authenticated session.

## Related Endpoints

- `GET /auth/google`
- `GET /auth/google/callback`
- `POST /auth/refresh`
- `POST /auth/logout`

## Token Lifecycle

- Access token: short-lived, used for API authorization
- Refresh token: long-lived, used to request new access tokens
- On logout, refresh token should be revoked
