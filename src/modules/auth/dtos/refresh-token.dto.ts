import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token to exchange for a new access token',
    example: 'user-id:token-id',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
