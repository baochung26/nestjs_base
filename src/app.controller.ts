import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExtraModels } from '@nestjs/swagger';
import { ApiInfoResponseDto, ApiRootResponseDto } from './app/dtos/api-info-response.dto';

@ApiTags('App')
@ApiExtraModels(ApiInfoResponseDto, ApiRootResponseDto)
@Controller({
  path: '',
  version: VERSION_NEUTRAL,
})
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API Information', description: 'Thông tin về API và các endpoints có sẵn.' })
  @ApiResponse({ status: 200, type: ApiInfoResponseDto, description: 'API information retrieved successfully' })
  getApiInfo() {
    return {
      success: true,
      message: 'NestJS API is running',
      version: '1.0.0',
      endpoints: {
        v1: '/api/v1',
        health: '/api/v1/health',
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        admin: '/api/v1/admin',
      },
      documentation: 'See README.md for API documentation',
    };
  }

  @Get('api')
  @ApiOperation({ summary: 'API Root', description: 'Thông tin chi tiết về API root và các endpoints với HTTP methods.' })
  @ApiResponse({ status: 200, type: ApiRootResponseDto, description: 'API root information retrieved successfully' })
  getApiRoot() {
    return {
      success: true,
      message: 'Welcome to NestJS API',
      version: '1.0.0',
      baseUrl: '/api/v1',
      endpoints: {
        health: '/api/v1/health',
        auth: {
          register: 'POST /api/v1/auth/register',
          login: 'POST /api/v1/auth/login',
          profile: 'GET /api/v1/auth/profile',
        },
        users: {
          list: 'GET /api/v1/users',
          get: 'GET /api/v1/users/:id',
          create: 'POST /api/v1/users',
          update: 'PATCH /api/v1/users/:id',
          delete: 'DELETE /api/v1/users/:id',
        },
        admin: {
          dashboard: 'GET /api/v1/admin/dashboard',
          users: 'GET /api/v1/admin/users',
          settings: 'GET /api/v1/admin/settings',
        },
      },
    };
  }
}
