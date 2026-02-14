import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from '@nestjs/common';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const correlationId = request.id || request.headers['x-correlation-id'];

    const startTime = Date.now();

    this.logger.log(
      `Incoming ${method} ${url} - correlationId=${correlationId} - body=${JSON.stringify(
        this.sanitizeBody(body),
      )} - query=${JSON.stringify(query)} - params=${JSON.stringify(params)}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - startTime;

          this.logger.log(
            `Outgoing ${method} ${url} ${response.statusCode} - correlationId=${correlationId} - duration=${duration}ms`,
          );
        },
        error: (error) => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - startTime;

          this.logger.error(
            {
              correlationId,
              method,
              url,
              statusCode: response.statusCode || 500,
              duration: `${duration}ms`,
              error: {
                message: error.message,
                stack: error.stack,
              },
            },
            `Error ${method} ${url} ${response.statusCode || 500}`,
          );
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    return this.sanitizeValue(body);
  }

  private sanitizeValue(value: any, key?: string): any {
    if (value === null || value === undefined) return value;

    if (key && this.isSensitiveKey(key)) {
      return '***';
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item));
    }

    if (typeof value === 'object') {
      const result: Record<string, any> = {};
      for (const [childKey, childValue] of Object.entries(value)) {
        result[childKey] = this.sanitizeValue(childValue, childKey);
      }
      return result;
    }

    return value;
  }

  private isSensitiveKey(key: string): boolean {
    const normalized = key.toLowerCase();
    return (
      normalized.includes('password') ||
      normalized.includes('token') ||
      normalized.includes('secret') ||
      normalized.includes('authorization') ||
      normalized.includes('cookie')
    );
  }
}
