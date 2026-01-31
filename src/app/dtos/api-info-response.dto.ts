import { ApiProperty } from '@nestjs/swagger';

export class ApiInfoResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'NestJS API is running' })
  message: string;

  @ApiProperty({ example: '1.0.0' })
  version: string;

  @ApiProperty({
    type: 'object',
    properties: {
      v1: { type: 'string', example: '/api/v1' },
      health: { type: 'string', example: '/api/v1/health' },
      auth: { type: 'string', example: '/api/v1/auth' },
      users: { type: 'string', example: '/api/v1/users' },
      admin: { type: 'string', example: '/api/v1/admin' },
    },
  })
  endpoints: Record<string, string>;

  @ApiProperty({ example: 'See README.md for API documentation' })
  documentation: string;
}

export class ApiRootResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Welcome to NestJS API' })
  message: string;

  @ApiProperty({ example: '1.0.0' })
  version: string;

  @ApiProperty({ example: '/api/v1' })
  baseUrl: string;

  @ApiProperty({
    type: 'object',
    properties: {
      health: { type: 'string', example: '/api/v1/health' },
      auth: {
        type: 'object',
        properties: {
          register: { type: 'string', example: 'POST /api/v1/auth/register' },
          login: { type: 'string', example: 'POST /api/v1/auth/login' },
          profile: { type: 'string', example: 'GET /api/v1/auth/profile' },
        },
      },
      users: {
        type: 'object',
        properties: {
          list: { type: 'string', example: 'GET /api/v1/users' },
          get: { type: 'string', example: 'GET /api/v1/users/:id' },
        },
      },
    },
  })
  endpoints: Record<string, any>;
}
