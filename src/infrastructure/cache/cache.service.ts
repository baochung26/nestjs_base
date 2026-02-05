import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug({ key }, 'Cache hit');
      } else {
        this.logger.debug({ key }, 'Cache miss');
      }
      return value;
    } catch (error) {
      this.logger.error(
        { key, error: error.message },
        'Error getting from cache',
      );
      return undefined;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug({ key, ttl }, 'Cache set');
    } catch (error) {
      this.logger.error({ key, error: error.message }, 'Error setting cache');
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug({ key }, 'Cache deleted');
    } catch (error) {
      this.logger.error(
        { key, error: error.message },
        'Error deleting from cache',
      );
    }
  }

  /**
   * Delete multiple keys from cache
   */
  async delMultiple(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map((key) => this.cacheManager.del(key)));
      this.logger.debug({ keys }, 'Multiple cache keys deleted');
    } catch (error) {
      this.logger.error(
        { keys, error: error.message },
        'Error deleting multiple keys from cache',
      );
    }
  }

  /**
   * Reset entire cache
   */
  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.logger.debug('Cache reset');
    } catch (error) {
      this.logger.error({ error: error.message }, 'Error resetting cache');
    }
  }

  /**
   * Get or set value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  /**
   * Get multiple keys
   */
  async getMultiple<T>(keys: string[]): Promise<Map<string, T | undefined>> {
    const result = new Map<string, T | undefined>();
    await Promise.all(
      keys.map(async (key) => {
        const value = await this.get<T>(key);
        result.set(key, value);
      }),
    );
    return result;
  }

  /**
   * Set multiple keys
   */
  async setMultiple(
    entries: Array<{ key: string; value: any; ttl?: number }>,
  ): Promise<void> {
    await Promise.all(
      entries.map(({ key, value, ttl }) => this.set(key, value, ttl)),
    );
  }

  /**
   * Increment numeric value
   */
  async increment(key: string, by = 1): Promise<number> {
    const current = (await this.get<number>(key)) || 0;
    const newValue = current + by;
    await this.set(key, newValue);
    return newValue;
  }

  /**
   * Decrement numeric value
   */
  async decrement(key: string, by = 1): Promise<number> {
    const current = (await this.get<number>(key)) || 0;
    const newValue = current - by;
    await this.set(key, newValue);
    return newValue;
  }

  /**
   * Generate cache key with prefix
   */
  generateKey(prefix: string, ...parts: (string | number)[]): string {
    return `${prefix}:${parts.join(':')}`;
  }
}
