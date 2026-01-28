import { Controller, Post, Body, UseGuards, Get, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { SkipThrottle, ThrottlePreset } from '../../../common/decorators/skip-throttle.decorator';
import { User } from '../../users/entities/user.entity';
import { Request, Response } from 'express';
import { googleOAuthConfig } from '../../../config/configuration';
import { SUCCESS_MESSAGES } from '../../../common/constants';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ThrottlePreset('short') // 10 requests per 10 seconds for registration
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ThrottlePreset('short') // 10 requests per 10 seconds for login
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        role: { type: 'string' },
        access_token: { type: 'string', description: 'JWT access token (short-lived, ~15 minutes)' },
        refresh_token: { type: 'string', description: 'Refresh token (long-lived, ~7 days)' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const result = await this.authService.googleLogin(user);

    // Redirect to frontend with tokens
    const google = this.configService.get('google');
    const frontendUrl = google?.frontendURL || process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(
      `${frontendUrl}/auth/callback?access_token=${result.access_token}&refresh_token=${result.refresh_token}&user=${encodeURIComponent(JSON.stringify(result))}`,
    );
  }

  @Post('google/login')
  async googleLogin(@Body() body: { accessToken: string }) {
    // Alternative endpoint for mobile apps or SPA
    // This would require validating the Google access token
    // For now, we'll use the OAuth flow above
    throw new Error('Use GET /auth/google for OAuth flow');
  }

  @Post('refresh')
  @ThrottlePreset('short') // 10 requests per 10 seconds
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Access token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', description: 'New JWT access token' },
        refresh_token: { type: 'string', description: 'New refresh token (old one is revoked)' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @ThrottlePreset('short') // 10 requests per 10 seconds
  @ApiOperation({ summary: 'Logout user by revoking refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: SUCCESS_MESSAGES.LOGOUT_SUCCESS },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    await this.authService.logout(refreshTokenDto.refreshToken);
    return { message: SUCCESS_MESSAGES.LOGOUT_SUCCESS };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or expired token' })
  getProfile(@CurrentUser() user: User) {
    return user;
  }
}
