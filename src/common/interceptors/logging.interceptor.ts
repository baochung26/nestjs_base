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
        next: (data) => {
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
