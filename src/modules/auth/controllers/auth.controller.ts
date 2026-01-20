import { Controller, Post, Body, UseGuards, Get, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { SkipThrottle, ThrottlePreset } from '../../../common/decorators/skip-throttle.decorator';
import { User } from '../../users/entities/user.entity';
import { Request, Response } from 'express';
import { googleOAuthConfig } from '../../../config/configuration';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ThrottlePreset('short') // 10 requests per 10 seconds for registration
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ThrottlePreset('short') // 10 requests per 10 seconds for login
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

    // Redirect to frontend with token
    const google = this.configService.get('google');
    const frontendUrl = google?.frontendURL || process.env.FRONTEND_URL || 'http://localhost:3001';
    res.redirect(
      `${frontendUrl}/auth/callback?token=${result.access_token}&user=${encodeURIComponent(JSON.stringify(result))}`,
    );
  }

  @Post('google/login')
  async googleLogin(@Body() body: { accessToken: string }) {
    // Alternative endpoint for mobile apps or SPA
    // This would require validating the Google access token
    // For now, we'll use the OAuth flow above
    throw new Error('Use GET /auth/google for OAuth flow');
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: User) {
    return user;
  }
}
