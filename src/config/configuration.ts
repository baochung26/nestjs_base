import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  // Port configuration (đơn giản hóa):
  // - Trong Docker: PORT=3000 (hardcode, container port luôn là 3000)
  // - Local dev: APP_PORT từ .env hoặc default 3000
  // - Cloud platforms: PORT được set tự động (Heroku, Railway, etc.)
  // Default: 3000 (đơn giản nhất, không cần config)
  const port = parseInt(
    process.env.PORT || // Cloud platforms hoặc Docker (ưu tiên)
      process.env.APP_PORT || // Local development
      '3000', // Default: 3000 (đơn giản)
    10,
  );

  return {
    port,
    env: process.env.NODE_ENV || 'development',
    prefix: 'api',
    baseUrl: process.env.APP_BASE_URL || `http://localhost:${port}`,
  };
});

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'nestjs_db',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || '',
  db: parseInt(process.env.REDIS_DB || '0', 10),
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m', // Short-lived access token
  refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d', // Long-lived refresh token
  // Backward compatibility
  expiresIn:
    process.env.JWT_EXPIRES_IN ||
    process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ||
    '15m',
}));

export const googleOAuthConfig = registerAs('google', () => ({
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
  frontendURL: process.env.FRONTEND_URL || 'http://localhost:3000',
}));

export const mailConfig = registerAs('mail', () => ({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT || '587', 10),
  secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASSWORD || '',
  },
  from: process.env.MAIL_FROM || process.env.MAIL_USER || '',
  fromName: process.env.MAIL_FROM_NAME || 'NestJS App',
}));

const BULL_BOARD_DEFAULT_PATH = '/admin/queues';

export const bullBoardConfig = registerAs('bullBoard', () => ({
  path: process.env.BULL_BOARD_PATH ?? BULL_BOARD_DEFAULT_PATH,
  enabled: process.env.BULL_BOARD_ENABLED !== 'false',
  /** Secret key bảo vệ truy cập. Truyền qua ?key=XXX hoặc header X-Bull-Board-Key */
  secretKey: process.env.BULL_BOARD_SECRET_KEY ?? '',
}));

export const storageConfig = registerAs('storage', () => ({
  type: process.env.STORAGE_TYPE || 'local',
  local: {
    destination: process.env.STORAGE_LOCAL_DESTINATION || './uploads',
    maxFileSize: parseInt(process.env.STORAGE_MAX_FILE_SIZE || '10485760', 10), // 10MB default
    allowedMimeTypes: process.env.STORAGE_ALLOWED_MIME_TYPES
      ? process.env.STORAGE_ALLOWED_MIME_TYPES.split(',')
      : [
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/pdf',
          'text/plain',
        ],
  },
}));
