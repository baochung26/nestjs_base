import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UserDto } from '../dtos/user.dto';
import { BaseMapper } from '../../../common/mappers/base.mapper';

/**
 * User Mapper để chuyển đổi giữa User Entity và DTOs
 */
export class UserMapper extends BaseMapper<User, UserDto> {
  /**
   * Convert User entity to UserDto (exclude password)
   */
  toDto(user: User): UserDto {
    const dto = new UserDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.role = user.role;
    dto.isActive = user.isActive;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }

  /**
   * Convert CreateUserDto to User entity (partial)
   */
  toEntity(dto: Partial<CreateUserDto>): Partial<User> {
    const entity: Partial<User> = {};
    if (dto.email) entity.email = dto.email;
    if (dto.firstName) entity.firstName = dto.firstName;
    if (dto.lastName) entity.lastName = dto.lastName;
    if (dto.role) entity.role = dto.role;
    return entity;
  }

  /**
   * Convert UpdateUserDto to User entity (partial)
   */
  toEntityFromUpdate(dto: Partial<UpdateUserDto>): Partial<User> {
    const entity: Partial<User> = {};
    if (dto.email) entity.email = dto.email;
    if (dto.firstName) entity.firstName = dto.firstName;
    if (dto.lastName) entity.lastName = dto.lastName;
    if (dto.role) entity.role = dto.role;
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;
    return entity;
  }

  /**
   * Convert User entity to UserDto array
   */
  toDtoArray(users: User[]): UserDto[] {
    return users.map((user) => this.toDto(user));
  }
}
