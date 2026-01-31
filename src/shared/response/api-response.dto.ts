import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard API Response Format
 */
export class ApiResponseDto<T = any> {
  @ApiProperty({ example: true, description: 'Indicates if the request was successful' })
  success: boolean;

  @ApiProperty({ example: 200, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({ example: 'Success', description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data', required: false })
  data?: T;

  @ApiProperty({ example: '2024-01-19T10:30:00.000Z', description: 'Response timestamp' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/users', description: 'Request path', required: false })
  path?: string;

  constructor(
    success: boolean,
    statusCode: number,
    message: string,
    data?: T,
    path?: string,
  ) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
    this.path = path;
  }
}

/**
 * Standard API Error Response Format
 */
export class ApiErrorResponseDto {
  @ApiProperty({ example: false, description: 'Indicates if the request was successful' })
  success: boolean;

  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({ 
    example: 'Bad Request', 
    description: 'Error message (can be string or array of strings for validation errors)',
    oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'string' } }
    ]
  })
  message: string | string[];

  @ApiProperty({ 
    example: 'Validation failed', 
    description: 'Error details (optional)',
    required: false,
    oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'string' } },
      { type: 'object' }
    ]
  })
  error?: string | string[] | object;

  @ApiProperty({ example: '2024-01-19T10:30:00.000Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/users', description: 'Request path' })
  path: string;

  constructor(
    statusCode: number,
    message: string | string[],
    error?: string | string[] | object,
    path?: string,
  ) {
    this.success = false;
    this.statusCode = statusCode;
    this.message = message;
    this.error = error;
    this.timestamp = new Date().toISOString();
    this.path = path || '';
  }
}
