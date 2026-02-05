import * as Joi from 'joi';

/**
 * Validation schema cho environment variables
 * Sử dụng Joi để validate và đảm bảo tất cả required variables đều có giá trị
 */
export const validationSchema = Joi.object({
  // App Configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .description('Node environment'),

  // PORT: Set trong docker-compose cho container (3000). App local dùng APP_PORT.
  PORT: Joi.number()
    .port()
    .optional()
    .description('Container listen port (12-Factor App)'),

  // Docker port mapping (chỉ dùng trong docker-compose, port trên host)
  APP_HOST_PORT: Joi.number()
    .port()
    .optional()
    .description('Host port for app (Docker mapping)'),
  POSTGRES_HOST_PORT: Joi.number()
    .port()
    .optional()
    .description('Host port for Postgres (Docker mapping)'),
  REDIS_HOST_PORT: Joi.number()
    .port()
    .optional()
    .description('Host port for Redis (Docker mapping)'),
  PGADMIN_HOST_PORT: Joi.number()
    .port()
    .optional()
    .description('Host port for pgAdmin (Docker mapping)'),

  // APP_PORT: port app lắng nghe khi chạy local. Trong Docker dùng PORT=3000.
  APP_PORT: Joi.number()
    .port()
    .default(3000)
    .description('App listen port (local dev)'),

  // Database Configuration (port app dùng để kết nối DB)
  DB_HOST: Joi.string().required().description('Database host'),
  DB_PORT: Joi.number()
    .port()
    .default(5432)
    .description('Database connection port'),
  DB_USER: Joi.string().required().description('Database username'),
  DB_PASSWORD: Joi.string().required().description('Database password'),
  DB_NAME: Joi.string().required().description('Database name'),
  DB_SSL: Joi.string()
    .valid('true', 'false')
    .default('false')
    .description('Enable SSL for database connection'),

  // Redis Configuration (port app dùng để kết nối Redis)
  REDIS_HOST: Joi.string().default('localhost').description('Redis host'),
  REDIS_PORT: Joi.number()
    .port()
    .default(6379)
    .description('Redis connection port'),
  REDIS_PASSWORD: Joi.string()
    .allow('')
    .default('')
    .description('Redis password'),
  REDIS_DB: Joi.number()
    .integer()
    .min(0)
    .max(15)
    .default(0)
    .description('Redis database number'),

  // JWT Configuration
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT secret key (minimum 32 characters)'),
  JWT_ACCESS_TOKEN_EXPIRES_IN: Joi.string()
    .default('15m')
    .description('Access token expiration time (e.g., 15m, 1h)'),
  JWT_REFRESH_TOKEN_EXPIRES_IN: Joi.string()
    .default('7d')
    .description('Refresh token expiration time (e.g., 7d, 30d)'),
  JWT_EXPIRES_IN: Joi.string()
    .default('15m')
    .description(
      'JWT expiration time - backward compatibility (e.g., 7d, 24h, 60m)',
    ),

  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: Joi.string()
    .allow('')
    .default('')
    .description('Google OAuth Client ID'),
  GOOGLE_CLIENT_SECRET: Joi.string()
    .allow('')
    .default('')
    .description('Google OAuth Client Secret'),
  GOOGLE_CALLBACK_URL: Joi.string()
    .uri()
    .allow('')
    .default('')
    .description('Google OAuth Callback URL'),
  FRONTEND_URL: Joi.string()
    .uri()
    .default('http://localhost:3001')
    .description('Frontend URL for OAuth redirects'),

  // Mail Configuration
  MAIL_HOST: Joi.string().default('smtp.gmail.com').description('SMTP host'),
  MAIL_PORT: Joi.number().port().default(587).description('SMTP port'),
  MAIL_SECURE: Joi.string()
    .valid('true', 'false')
    .default('false')
    .description('Enable secure SMTP (true for 465, false for other ports)'),
  MAIL_USER: Joi.string()
    .email()
    .allow('')
    .default('')
    .description('SMTP username/email'),
  MAIL_PASSWORD: Joi.string()
    .allow('')
    .default('')
    .description('SMTP password'),
  MAIL_FROM: Joi.string()
    .email()
    .allow('')
    .default('')
    .description('Default from email address'),
  MAIL_FROM_NAME: Joi.string()
    .default('NestJS App')
    .description('Default from name'),

  // Storage Configuration
  STORAGE_TYPE: Joi.string()
    .valid('local', 's3', 'azure', 'gcp')
    .default('local')
    .description('Storage type'),
  STORAGE_LOCAL_DESTINATION: Joi.string()
    .default('./uploads')
    .description('Local storage destination path'),
  STORAGE_MAX_FILE_SIZE: Joi.number()
    .integer()
    .min(1024)
    .default(10485760)
    .description('Maximum file size in bytes (default: 10MB)'),
  STORAGE_ALLOWED_MIME_TYPES: Joi.string()
    .allow('')
    .default('image/jpeg,image/png,image/gif,application/pdf,text/plain')
    .description('Comma-separated list of allowed MIME types'),

  // CORS Configuration
  CORS_ORIGINS: Joi.string()
    .allow('')
    .default('http://localhost:3000,http://localhost:3001')
    .description('Comma-separated list of allowed CORS origins'),

  // pgAdmin Configuration (optional)
  PGADMIN_EMAIL: Joi.string()
    .email()
    .allow('')
    .default('')
    .description('pgAdmin email'),
  PGADMIN_PASSWORD: Joi.string()
    .allow('')
    .default('')
    .description('pgAdmin password'),
  PGADMIN_PORT: Joi.number()
    .port()
    .optional()
    .description('pgAdmin host port (deprecated, use PGADMIN_HOST_PORT)'),
});

/**
 * Validation options
 */
export const validationOptions = {
  /**
   * Cho phép unknown keys (không throw error nếu có env vars không được định nghĩa)
   * Hữu ích khi có các env vars từ third-party services
   */
  allowUnknown: true,

  /**
   * Bỏ qua các giá trị null/undefined
   */
  stripUnknown: true,

  /**
   * Abort early: dừng validation ngay khi gặp lỗi đầu tiên
   * Set false để xem tất cả lỗi cùng lúc
   */
  abortEarly: false,
};
