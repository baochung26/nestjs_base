# Google OAuth Setup

This guide configures Google OAuth for the NestJS backend.

## 1. Create OAuth Credentials

In Google Cloud Console:

1. Create or select a project.
2. Configure OAuth consent screen.
3. Create `OAuth 2.0 Client ID` (Web application).

Add authorized redirect URI:

- `http://localhost:3001/api/v1/auth/google/callback`

## 2. Configure Environment Variables

Set these values in `.env`:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

## 3. Start the App

```bash
npm run start:dev
```

or with Docker:

```bash
docker compose up -d
```

## 4. Test OAuth Flow

Open:

- `GET /api/v1/auth/google`

After successful login, backend redirects to:

- `${FRONTEND_URL}/auth/callback?...`

with `access_token` and `refresh_token` query parameters.

## Troubleshooting

- `redirect_uri_mismatch`: check callback URL in Google Console and `.env`
- 401 after callback: verify client id/secret and consent screen status
- Frontend not receiving tokens: verify `FRONTEND_URL`

## Security Notes

- Never commit real OAuth credentials
- Use separate OAuth clients for dev/staging/production
