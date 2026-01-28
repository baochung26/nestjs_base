import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/services/users.service';
import { RefreshTokenService } from './refresh-token.service';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { User } from '../../users/entities/user.entity';
import { UserDto } from '../../users/dtos/user.dto';
import { UnauthorizedException } from '../../../shared/errors/custom-exceptions';
import { ERROR_MESSAGES } from '../../../common/constants';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async register(registerDto: RegisterDto) {
    this.logger.debug(`Registering new user: ${registerDto.email}`);

    const userDto = await this.usersService.create(registerDto);
    
    // Get full user entity for token generation
    const user = await this.usersService.findByEmail(userDto.email);
    if (!user) {
      throw new Error('User not found after creation');
    }

    const tokens = await this.generateTokens(user);

    this.logger.log(`User registered successfully: ${userDto.email} (ID: ${userDto.id})`);
    return {
      ...userDto,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    this.logger.debug(`Attempting user login: ${loginDto.email}`);

    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      this.logger.warn(`Login failed: invalid credentials for ${loginDto.email}`);
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Get full user entity for token generation
    const fullUser = await this.usersService.findOne(user.id);
    if (!fullUser) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const tokens = await this.generateTokens(fullUser);

    this.logger.log(`User logged in successfully: ${user.email} (ID: ${user.id})`);
    return {
      ...user,
      ...tokens,
    };
  }

  async googleLogin(googleUser: {
    email: string;
    firstName: string;
    lastName: string;
    picture?: string;
  }) {
    const user = await this.usersService.findOrCreateGoogleUser(googleUser);
    const { password, ...result } = user;

    const tokens = await this.generateTokens(user);

    return {
      ...result,
      ...tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const payload = await this.refreshTokenService.validateRefreshToken(refreshToken);
    
    if (!payload) {
      this.logger.warn('Invalid refresh token');
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    // Get user to ensure they still exist and are active
    const user = await this.usersService.findOne(payload.userId);
    if (!user || !user.isActive) {
      this.logger.warn({ userId: payload.userId }, 'User not found or inactive');
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user);

    // Revoke old refresh token (optional: you can keep multiple refresh tokens)
    await this.refreshTokenService.revokeRefreshToken(refreshToken);

    this.logger.log({ userId: user.id }, 'Access token refreshed');
    return tokens;
  }

  /**
   * Logout user by revoking refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenService.revokeRefreshToken(refreshToken);
    this.logger.debug('User logged out');
  }

  /**
   * Generate both access token and refresh token
   * Accepts UserDto (no password needed for token generation)
   */
  private async generateTokens(user: UserDto | User): Promise<TokenResponse> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.refreshTokenService.generateRefreshToken(
      user.id,
      user.email,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  /**
   * Generate access token (short-lived)
   * Accepts UserDto (only needs id, email, role)
   */
  private generateAccessToken(user: UserDto | User): string {
    const jwt = this.configService.get('jwt');
    const payload = { email: user.email, sub: user.id, role: user.role };
    return this.jwtService.sign(payload, {
      secret: jwt?.secret || 'your-secret-key',
      expiresIn: jwt?.accessTokenExpiresIn || jwt?.expiresIn || '15m',
    });
  }
}
