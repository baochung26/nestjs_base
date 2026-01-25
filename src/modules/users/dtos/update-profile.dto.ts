import { IsOptional, IsString, MinLength } from 'class-validator';
import { USER_DEFAULTS } from '../../../common/constants';

/**
 * DTO cho user tự cập nhật thông tin profile của chính mình.
 * Chỉ cho phép sửa: firstName, lastName, password.
 * Không cho phép sửa: email, role, isActive (chỉ admin mới sửa được).
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  @MinLength(USER_DEFAULTS.MIN_PASSWORD_LENGTH, {
    message: `password must be at least ${USER_DEFAULTS.MIN_PASSWORD_LENGTH} characters`,
  })
  password?: string;
}
