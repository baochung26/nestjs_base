import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.APP_PORT || '3000', 10),
  env: process.env.NODE_ENV || 'development',
  prefix: 'api',
}));

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
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
}));

export const googleOAuthConfig = registerAs('google', () => ({
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
  frontendURL: process.env.FRONTEND_URL || 'http://localhost:3001',
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

export const storageConfig = registerAs('storage', () => ({
  type: process.env.STORAGE_TYPE || 'local',
  local: {
    destination: process.env.STORAGE_LOCAL_DESTINATION || './uploads',
    maxFileSize: parseInt(process.env.STORAGE_MAX_FILE_SIZE || '10485760', 10), // 10MB default
    allowedMimeTypes: process.env.STORAGE_ALLOWED_MIME_TYPES
      ? process.env.STORAGE_ALLOWED_MIME_TYPES.split(',')
      : ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
  },
}));
