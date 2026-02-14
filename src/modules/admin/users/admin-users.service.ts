import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { UsersRepository } from '../../users/repositories/users.repository';
import { UserMapper } from '../../users/mappers/user.mapper';
import { UpdateUserDto } from '../../users/dtos/update-user.dto';
import { CreateUserDto } from '../../users/dtos/create-user.dto';
import { PaginatedResponseDto } from '../../../shared/pagination/pagination.dto';
import { UserDto } from '../../users/dtos/user.dto';
import { PAGINATION } from '../../../common/constants';
import { ForbiddenException } from '../../../shared/errors/custom-exceptions';
import { ERROR_MESSAGES } from '../../../common/constants';

@Injectable()
export class AdminUsersService {
  private readonly userMapper = new UserMapper();

  constructor(
    private usersService: UsersService,
    private usersRepository: UsersRepository,
  ) {}

  async getAllUsers(
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
  ): Promise<PaginatedResponseDto<UserDto>> {
    const currentPage = page || PAGINATION.DEFAULT_PAGE;
    const currentLimit = limit || PAGINATION.DEFAULT_LIMIT;
    const currentSortBy = sortBy || 'createdAt';
    const currentSortOrder = sortOrder || 'DESC';

    const { users, total } = await this.usersRepository.findAllUsersPaginated(
      currentPage,
      currentLimit,
      currentSortBy,
      currentSortOrder,
    );

    const userDtos = this.userMapper.toDtoArray(users);

    return new PaginatedResponseDto(
      userDtos,
      currentPage,
      currentLimit,
      total,
      'Users retrieved successfully',
    );
  }

  async getUserById(id: string) {
    return this.usersService.findOne(id);
  }

  async createUser(createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId: string,
  ) {
    if (id === currentUserId && updateUserDto.isActive === false) {
      throw new ForbiddenException(ERROR_MESSAGES.CANNOT_DEACTIVATE_SELF);
    }

    return this.usersService.update(id, updateUserDto);
  }

  async deleteUser(id: string) {
    return this.usersService.removeById(id);
  }

  async activateUser(id: string) {
    return this.usersService.update(id, { isActive: true });
  }

  async deactivateUser(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new ForbiddenException(ERROR_MESSAGES.CANNOT_DEACTIVATE_SELF);
    }

    return this.usersService.update(id, { isActive: false });
  }

  async searchUsers(
    searchTerm?: string,
    role?: string,
    isActive?: boolean,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
  ): Promise<PaginatedResponseDto<UserDto>> {
    const currentPage = page || PAGINATION.DEFAULT_PAGE;
    const currentLimit = limit || PAGINATION.DEFAULT_LIMIT;
    const currentSortBy = sortBy || 'createdAt';
    const currentSortOrder = sortOrder || 'DESC';

    const { users, total } = await this.usersRepository.searchUsers(
      searchTerm,
      role,
      isActive,
      currentPage,
      currentLimit,
      currentSortBy,
      currentSortOrder,
    );

    const userDtos = this.userMapper.toDtoArray(users);

    return new PaginatedResponseDto(
      userDtos,
      currentPage,
      currentLimit,
      total,
      'Users found successfully',
    );
  }
}
