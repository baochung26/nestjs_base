import { ApiProperty } from '@nestjs/swagger';

export class HealthIndicatorDto {
  @ApiProperty({ example: 'up' })
  status: string;

  // Index signature không thể dùng decorator, để trống hoặc dùng any
  [key: string]: any;
}

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/HealthIndicatorDto' },
  })
  info: Record<string, HealthIndicatorDto>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/HealthIndicatorDto' },
    required: false,
  })
  error?: Record<string, HealthIndicatorDto>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/HealthIndicatorDto' },
    required: false,
  })
  details?: Record<string, HealthIndicatorDto>;
}
