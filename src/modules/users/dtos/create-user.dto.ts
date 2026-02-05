import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';
import { USER_DEFAULTS } from '../../../common/constants';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email đăng nhập' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Mật khẩu',
    minLength: USER_DEFAULTS.MIN_PASSWORD_LENGTH,
  })
  @IsString()
  @MinLength(USER_DEFAULTS.MIN_PASSWORD_LENGTH)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({
    enum: UserRole,
    required: false,
    description: 'Vai trò user (mặc định: user)',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
