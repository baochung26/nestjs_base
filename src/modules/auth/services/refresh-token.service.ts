import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../../infrastructure/cache/cache.service';
import { v4 as uuidv4 } from 'uuid';

export interface RefreshTokenPayload {
  userId: string;
  email: string;
  tokenId: string;
}

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);
  private readonly REFRESH_TOKEN_PREFIX = 'refresh_token';

  constructor(
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate a refresh token and store it in Redis
   */
  async generateRefreshToken(userId: string, email: string): Promise<string> {
    const tokenId = uuidv4();
    const refreshToken = `${userId}:${tokenId}`;

    const jwt = this.configService.get('jwt');
    const refreshTokenExpiresIn = jwt?.refreshTokenExpiresIn || '7d';

    // Convert expiresIn string to seconds (e.g., '7d' -> 604800)
    const ttlSeconds = this.parseExpiresIn(refreshTokenExpiresIn);

    const payload: RefreshTokenPayload = {
      userId,
      email,
      tokenId,
    };

    const cacheKey = this.getCacheKey(refreshToken);
    await this.cacheService.set(cacheKey, payload, ttlSeconds); // TTL in seconds

    this.logger.debug({ userId, tokenId }, 'Refresh token generated');

    return refreshToken;
  }

  /**
   * Validate and retrieve refresh token payload
   */
  async validateRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload | null> {
    const cacheKey = this.getCacheKey(refreshToken);
    const payload = await this.cacheService.get<RefreshTokenPayload>(cacheKey);

    if (!payload) {
      this.logger.warn(
        { refreshToken: this.maskToken(refreshToken) },
        'Invalid or expired refresh token',
      );
      return null;
    }

    return payload;
  }

  /**
   * Revoke a refresh token
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const cacheKey = this.getCacheKey(refreshToken);
    await this.cacheService.del(cacheKey);
    this.logger.debug(
      { refreshToken: this.maskToken(refreshToken) },
      'Refresh token revoked',
    );
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    // Note: This is a simplified implementation
    // In production, you might want to maintain a set of active tokens per user
    // For now, we'll rely on TTL expiration
    this.logger.debug(
      { userId },
      'All refresh tokens will expire naturally (TTL)',
    );
  }

  /**
   * Get cache key for refresh token
   */
  private getCacheKey(refreshToken: string): string {
    return this.cacheService.generateKey(
      this.REFRESH_TOKEN_PREFIX,
      refreshToken,
    );
  }

  /**
   * Parse expiresIn string to seconds
   * Supports: s (seconds), m (minutes), h (hours), d (days)
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      // Default to 7 days if format is invalid
      return 7 * 24 * 60 * 60;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    };

    return value * (multipliers[unit] || 1);
  }

  /**
   * Mask token for logging (show only first and last few characters)
   */
  private maskToken(token: string): string {
    if (token.length <= 10) {
      return '***';
    }
    return `${token.substring(0, 5)}...${token.substring(token.length - 5)}`;
  }
}
