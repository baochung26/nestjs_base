import { ApiProperty } from '@nestjs/swagger';
import { ApiErrorResponseDto } from './api-response.dto';

/**
 * Bad Request Error Response (400)
 */
export class BadRequestErrorResponseDto extends ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  message: string;

  @ApiProperty({ example: 'Validation failed', required: false })
  error?: string;

  @ApiProperty({ example: '2024-01-19T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/users' })
  path: string;
}

/**
 * Unauthorized Error Response (401)
 */
export class UnauthorizedErrorResponseDto extends ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({ example: 'Invalid credentials' })
  message: string;

  @ApiProperty({ example: 'Unauthorized', required: false })
  error?: string;

  @ApiProperty({ example: '2024-01-19T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/auth/login' })
  path: string;
}

/**
 * Forbidden Error Response (403)
 */
export class ForbiddenErrorResponseDto extends ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 403 })
  statusCode: number;

  @ApiProperty({
    example: 'You do not have permission to access this resource',
  })
  message: string;

  @ApiProperty({ example: 'Forbidden', required: false })
  error?: string;

  @ApiProperty({ example: '2024-01-19T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/admin/users' })
  path: string;
}

/**
 * Not Found Error Response (404)
 */
export class NotFoundErrorResponseDto extends ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'User with ID 123 not found' })
  message: string;

  @ApiProperty({ example: 'Not Found', required: false })
  error?: string;

  @ApiProperty({ example: '2024-01-19T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/users/123' })
  path: string;
}

/**
 * Conflict Error Response (409)
 */
export class ConflictErrorResponseDto extends ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({ example: 'Email already exists' })
  message: string;

  @ApiProperty({ example: 'Conflict', required: false })
  error?: string;

  @ApiProperty({ example: '2024-01-19T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/auth/register' })
  path: string;
}

/**
 * Validation Error Response (422)
 */
export class ValidationErrorResponseDto extends ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 422 })
  statusCode: number;

  @ApiProperty({
    example: [
      'email must be an email',
      'password must be longer than or equal to 6 characters',
    ],
    type: [String],
  })
  message: string[];

  @ApiProperty({ example: 'Validation Error', required: false })
  error?: string;

  @ApiProperty({ example: '2024-01-19T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/auth/register' })
  path: string;
}

/**
 * Too Many Requests Error Response (429)
 */
export class TooManyRequestsErrorResponseDto extends ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 429 })
  statusCode: number;

  @ApiProperty({ example: 'Too many requests' })
  message: string;

  @ApiProperty({ example: 'Too Many Requests', required: false })
  error?: string;

  @ApiProperty({ example: '2024-01-19T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/auth/login' })
  path: string;
}

/**
 * Internal Server Error Response (500)
 */
export class InternalServerErrorResponseDto extends ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 500 })
  statusCode: number;

  @ApiProperty({ example: 'Internal server error' })
  message: string;

  @ApiProperty({ example: 'Internal Server Error', required: false })
  error?: string;

  @ApiProperty({ example: '2024-01-19T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/users' })
  path: string;
}
