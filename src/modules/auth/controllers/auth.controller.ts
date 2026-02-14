import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { LoginResponseDto } from '../dtos/login-response.dto';
import { RefreshTokenResponseDto } from '../dtos/refresh-token-response.dto';
import { RegisterResponseDto } from '../dtos/register-response.dto';
import { LogoutResponseDto } from '../dtos/logout-response.dto';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ThrottlePreset } from '../../../common/decorators/skip-throttle.decorator';
import {
  ApiAuthCommonResponses,
  ApiProtectedCommonResponses,
  ApiTooManyRequestsResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '../../../common/decorators/api-common-responses.decorator';
import { ApiStandardResponse } from '../../../common/decorators/api-response.decorator';
import { User } from '../../users/entities/user.entity';
import { UserResponseDto } from '../../users/dtos/user-response.dto';
import { Request, Response } from 'express';
import { SUCCESS_MESSAGES } from '../../../common/constants';

@ApiTags('auth')
@ApiExtraModels(
  LoginResponseDto,
  RefreshTokenResponseDto,
  RegisterResponseDto,
  LogoutResponseDto,
  UserResponseDto,
)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ThrottlePreset('short')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Đăng ký user mới. Sau khi đăng ký thành công, trả về thông tin user cùng access_token và refresh_token.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiStandardResponse(RegisterResponseDto, 'User registered successfully', 201)
  @ApiBadRequestResponse('Bad request — validation failed')
  @ApiConflictResponse('Conflict — email already exists')
  @ApiTooManyRequestsResponse(
    'Too many requests — vượt giới hạn throttle (10 requests / 10 giây)',
  )
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @ThrottlePreset('short')
  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Xác thực email và mật khẩu, trả về thông tin user cùng access_token (JWT) và refresh_token. Dùng access_token trong header `Authorization: Bearer <token>` cho các API bảo vệ. Dùng refresh_token gọi POST /auth/refresh khi access_token hết hạn.',
  })
  @ApiBody({ type: LoginDto })
  @ApiStandardResponse(
    LoginResponseDto,
    'Đăng nhập thành công. Trả về user và cặp token.',
    200,
  )
  @ApiAuthCommonResponses()
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth login',
    description:
      'Khởi động OAuth flow với Google. Redirect đến Google login page.',
  })
  @ApiResponse({ status: 302, description: 'Redirect to Google OAuth' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth callback',
    description:
      'Callback endpoint sau khi Google xác thực. Redirect về frontend với tokens.',
  })
  @ApiResponse({ status: 302, description: 'Redirect to frontend with tokens' })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const result = await this.authService.googleLogin(user);

    const google = this.configService.get('google');
    const frontendUrl =
      google?.frontendURL ||
      process.env.FRONTEND_URL ||
      'http://localhost:3001';
    res.redirect(
      `${frontendUrl}/auth/callback?access_token=${result.access_token}&refresh_token=${result.refresh_token}&user=${encodeURIComponent(JSON.stringify(result))}`,
    );
  }

  @Post('google/login')
  @ApiOperation({
    summary: 'Google login (deprecated)',
    description:
      'Endpoint này không được hỗ trợ. Sử dụng GET /auth/google để khởi động OAuth flow.',
  })
  @ApiResponse({
    status: 400,
    description: 'Use GET /auth/google for OAuth flow',
  })
  async googleLogin() {
    throw new BadRequestException('Use GET /auth/google for OAuth flow');
  }

  @Post('refresh')
  @ThrottlePreset('short')
  @ApiOperation({
    summary: 'Refresh access token using refresh token',
    description:
      'Dùng refresh_token để lấy access_token mới. Refresh token cũ sẽ bị revoke sau khi refresh thành công.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiStandardResponse(
    RefreshTokenResponseDto,
    'Access token refreshed successfully',
    200,
  )
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiTooManyRequestsResponse(
    'Too many requests — vượt giới hạn throttle (10 requests / 10 giây)',
  )
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @ThrottlePreset('short')
  @ApiOperation({
    summary: 'Logout user by revoking refresh token',
    description:
      'Đăng xuất bằng cách revoke refresh_token. Sau khi logout, refresh_token không thể dùng để refresh access_token nữa.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiStandardResponse(LogoutResponseDto, 'Logout successful', 200)
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiTooManyRequestsResponse(
    'Too many requests — vượt giới hạn throttle (10 requests / 10 giây)',
  )
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    await this.authService.logout(refreshTokenDto.refreshToken);
    return { message: SUCCESS_MESSAGES.LOGOUT_SUCCESS };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Lấy thông tin profile của user hiện tại từ JWT token trong header Authorization.',
  })
  @ApiStandardResponse(
    UserResponseDto,
    'User profile retrieved successfully',
    200,
  )
  @ApiProtectedCommonResponses()
  getProfile(@CurrentUser() user: User) {
    return user;
  }
}
