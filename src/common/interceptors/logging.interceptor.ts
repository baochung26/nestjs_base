import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from 'nestjs-pino';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const correlationId = request.id || request.headers['x-correlation-id'];

    const startTime = Date.now();

    this.logger.info(
      {
        correlationId,
        method,
        url,
        body: this.sanitizeBody(body),
        query,
        params,
      },
      `Incoming ${method} ${url}`,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - startTime;

          this.logger.info(
            {
              correlationId,
              method,
              url,
              statusCode: response.statusCode,
              duration: `${duration}ms`,
            },
            `Outgoing ${method} ${url} ${response.statusCode}`,
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
    if (!body) return body;

    const sanitized = { ...body };
    // Remove sensitive fields
    if (sanitized.password) {
      sanitized.password = '***';
    }
    if (sanitized.token) {
      sanitized.token = '***';
    }
    if (sanitized.access_token) {
      sanitized.access_token = '***';
    }
    return sanitized;
  }
}
