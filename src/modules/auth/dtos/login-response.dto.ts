import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ format: 'uuid', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ nullable: true })
  firstName: string | null;

  @ApiProperty({ nullable: true })
  lastName: string | null;

  @ApiProperty({ enum: ['user', 'admin'], description: 'Vai trò user' })
  role: string;

  @ApiProperty({
    description:
      'JWT access token (thời hạn ~15 phút). Gửi trong header: Authorization: Bearer <token>',
  })
  access_token: string;

  @ApiProperty({
    description:
      'Refresh token (thời hạn ~7 ngày). Dùng gọi POST /auth/refresh để lấy access_token mới.',
  })
  refresh_token: string;
}
