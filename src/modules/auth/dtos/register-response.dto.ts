import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterResponseDto {
  @ApiProperty({ format: 'uuid', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ enum: UserRole, description: 'Vai trò user' })
  role: UserRole;

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
