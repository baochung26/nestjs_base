import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenResponseDto {
  @ApiProperty({ description: 'New JWT access token' })
  access_token: string;

  @ApiProperty({ description: 'New refresh token (old one is revoked)' })
  refresh_token: string;
}
