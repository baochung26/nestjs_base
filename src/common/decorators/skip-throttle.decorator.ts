import { SetMetadata } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

/**
 * Decorator để skip rate limiting cho endpoint
 * Sử dụng khi muốn endpoint không bị rate limit
 */
export const SkipThrottle = (skipAll = true) => SetMetadata('skipThrottle', skipAll);

/**
 * Decorator để áp dụng custom rate limit cho endpoint
 * @param limit - Số lượng requests cho phép
 * @param ttl - Time to live (milliseconds)
 */
export const ThrottleCustom = (limit: number, ttl: number) =>
  // Với @nestjs/throttler v5, Throttle nhận vào Record<string, ThrottlerMethodOrControllerOptions>
  Throttle({
    default: { limit, ttl },
  });

/**
 * Decorator để sử dụng rate limit preset
 * @param preset - Tên preset ('short', 'long', 'default')
 */
export const ThrottlePreset = (preset: 'short' | 'long' | 'default' = 'default') => {
  const presets = {
    short: { limit: 10, ttl: 10000 }, // 10 requests per 10 seconds
    long: { limit: 1000, ttl: 600000 }, // 1000 requests per 10 minutes
    default: { limit: 100, ttl: 60000 }, // 100 requests per minute
  };

  return Throttle({
    [preset]: presets[preset],
  });
};
