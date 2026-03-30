import { SetMetadata } from '@nestjs/common';

export const CACHE_TTL_KEY = 'cache:ttl';
export const CACHE_KEY_KEY = 'cache:key';
export const CACHE_SKIP_KEY = 'cache:skip';

/**
 * Cache decorator - Cache response for specified TTL
 * @param ttl Time to live in seconds
 * @param key Custom cache key (optional)
 */
export const Cache = (ttl: number = 3600, key?: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_TTL_KEY, ttl)(target, propertyKey, descriptor);
    if (key) {
      SetMetadata(CACHE_KEY_KEY, key)(target, propertyKey, descriptor);
    }
  };
};

/**
 * Skip cache decorator - Skip caching for this endpoint
 */
export const SkipCache = () => SetMetadata(CACHE_SKIP_KEY, true);
