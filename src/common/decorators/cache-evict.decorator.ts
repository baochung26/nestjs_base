import { SetMetadata } from '@nestjs/common';

export const CACHE_EVICT_KEY = 'cache:evict';

export type CacheEvictValue = boolean | string | string[];

/**
 * CacheEvict decorator
 *
 * Dùng để đánh dấu route cần xóa cache sau khi handler chạy thành công.
 *
 * - `@CacheEvict()`:
 *    Evict theo request hiện tại (interceptor sẽ tạo cache key dạng GET để match với CacheInterceptor).
 * - `@CacheEvict('users:list')`:
 *    Evict 1 key cụ thể.
 * - `@CacheEvict(['users:list', 'users:search'])`:
 *    Evict nhiều key cùng lúc.
 */
export const CacheEvict = (key?: string | string[]) => {
  const value: CacheEvictValue = key ?? true;
  return SetMetadata(CACHE_EVICT_KEY, value);
};
