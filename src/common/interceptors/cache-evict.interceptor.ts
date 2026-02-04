import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import {
  CACHE_EVICT_KEY,
  CacheEvict,
  type CacheEvictValue,
} from '../decorators/cache-evict.decorator';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { Request } from 'express';

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
    const evictValue = this.reflector.getAllAndOverride<CacheEvictValue>(
      CACHE_EVICT_KEY,
      [handler, controller],
    );

    if (!evictValue) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => this.evict(evictValue, request)),
    );
  }

  private async evict(evictValue: CacheEvictValue, request: Request): Promise<void> {
    if (Array.isArray(evictValue)) {
      await this.cacheService.delMultiple(evictValue);
      return;
    }

    if (typeof evictValue === 'string') {
      await this.cacheService.del(evictValue);
      return;
    }

    // true => Evict theo request hiện tại (match cách tạo key của CacheInterceptor)
    const cacheKey = this.generateCacheKeyForGet(request);
    await this.cacheService.del(cacheKey);
  }

  /**
   * Tạo cache key theo cùng format với CacheInterceptor,
   * nhưng force method = GET để phù hợp với cache của các endpoint đọc dữ liệu.
   */
  private generateCacheKeyForGet(request: Request): string {
    const { url, query, params, user } = request as any;
    const queryString = JSON.stringify(query);
    const paramsString = JSON.stringify(params);
    const userId = (user as any)?.id || 'anonymous';

    return `cache:GET:${url}:${queryString}:${paramsString}:${userId}`;
  }
}
