import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CACHE_TTL_KEY, CACHE_KEY_KEY, CACHE_SKIP_KEY } from '../decorators/cache.decorator';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { Request } from 'express';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Check if cache should be skipped
    const skipCache = this.reflector.getAllAndOverride<boolean>(
      CACHE_SKIP_KEY,
      [handler, controller],
    );

    if (skipCache) {
      return next.handle();
    }

    // Get cache TTL and key from decorator
    const ttl = this.reflector.getAllAndOverride<number>(CACHE_TTL_KEY, [
      handler,
      controller,
    ]);

    if (!ttl) {
      return next.handle();
    }

    // Generate cache key
    const customKey = this.reflector.getAllAndOverride<string>(
      CACHE_KEY_KEY,
      [handler, controller],
    );

    const cacheKey = customKey || this.generateCacheKey(request);

    // Try to get from cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return of(cached);
    }

    // Execute handler and cache response
    return next.handle().pipe(
      tap(async (data) => {
        await this.cacheService.set(cacheKey, data, ttl);
      }),
    );
  }

  private generateCacheKey(request: Request): string {
    const { method, url, query, params, user } = request;
    const queryString = JSON.stringify(query);
    const paramsString = JSON.stringify(params);
    const userId = user?.id || 'anonymous';

    return `cache:${method}:${url}:${queryString}:${paramsString}:${userId}`;
  }
}
