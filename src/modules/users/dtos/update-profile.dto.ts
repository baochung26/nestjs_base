import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { USER_DEFAULTS } from '../../../common/constants';

/**
 * DTO cho user tự cập nhật thông tin profile của chính mình.
 * Chỉ cho phép sửa: firstName, lastName, password.
 * Không cho phép sửa: email, role, isActive (chỉ admin mới sửa được).
 */
export class UpdateProfileDto {
  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'newpassword123', required: false, minLength: USER_DEFAULTS.MIN_PASSWORD_LENGTH })
  @IsOptional()
  @IsString()
  @MinLength(USER_DEFAULTS.MIN_PASSWORD_LENGTH, {
    message: `password must be at least ${USER_DEFAULTS.MIN_PASSWORD_LENGTH} characters`,
  })
  password?: string;
}
