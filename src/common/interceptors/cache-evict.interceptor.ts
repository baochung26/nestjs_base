import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  SetMetadata,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CACHE_KEY_KEY } from '../decorators/cache.decorator';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { Request } from 'express';

export const CACHE_EVICT_KEY = 'cache:evict';

/**
 * Cache evict decorator metadata
 */
export const CacheEvict = (key?: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_EVICT_KEY, key || true)(target, propertyKey, descriptor);
  };
};

@Injectable()
export class CacheEvictInterceptor implements NestInterceptor {
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

    // Get cache evict key from decorator
    const evictKey = this.reflector.getAllAndOverride<string | boolean>(
      CACHE_EVICT_KEY,
      [handler, controller],
    );

    if (!evictKey) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        if (typeof evictKey === 'string') {
          // Evict specific key
          await this.cacheService.del(evictKey);
        } else {
          // Evict based on request
          const cacheKey = this.generateCacheKey(request);
          await this.cacheService.del(cacheKey);
        }
      }),
    );
  }

  private generateCacheKey(request: Request): string {
    const { method, url, query, params } = request;
    const queryString = JSON.stringify(query);
    const paramsString = JSON.stringify(params);

    return `cache:${method}:${url}:${queryString}:${paramsString}`;
  }
}
