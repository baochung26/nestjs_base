import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

/**
 * Cấu hình Helmet với các security headers
 */
export const getHelmetConfig = (configService: ConfigService) => {
  const isDevelopment = configService.get('app.env') !== 'production';

  return helmet({
    contentSecurityPolicy: isDevelopment ? false : {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: !isDevelopment,
    crossOriginOpenerPolicy: !isDevelopment,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: 'no-referrer' },
    xssFilter: true,
  });
};

/**
 * Cấu hình CORS
 * Load từ corsConfig trong ConfigModule
 */
export const getCorsConfig = (configService: ConfigService) => {
  const corsConfig = configService.get('cors');
  const allowedOrigins = corsConfig?.origins || [];

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS. Origin: ${origin} is not in allowed list: ${allowedOrigins.join(', ')}`));
      }
    },
    credentials: corsConfig?.credentials ?? true,
    methods: corsConfig?.methods || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: corsConfig?.allowedHeaders || ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    exposedHeaders: corsConfig?.exposedHeaders || ['X-Correlation-ID'],
    maxAge: corsConfig?.maxAge || 86400, // 24 hours
  };
};
