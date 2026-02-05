import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiExtraModels,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminUsersService } from './admin-users.service';
import { CreateUserDto } from '../../users/dtos/create-user.dto';
import { UpdateUserDto } from '../../users/dtos/update-user.dto';
import { UserResponseDto } from '../../users/dtos/user-response.dto';
import { UsersListResponseDto } from '../../users/dtos/users-list-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  ApiProtectedCommonResponses,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '../../../common/decorators/api-common-responses.decorator';
import {
  ApiStandardResponse,
  ApiPaginatedResponse,
} from '../../../common/decorators/api-response.decorator';
import { UserRole } from '../../users/entities/user.entity';
import {
  PaginationQueryDto,
  SortOrder,
} from '../../../shared/pagination/pagination.dto';

@ApiTags('admin')
@ApiExtraModels(UserResponseDto, UsersListResponseDto)
@ApiBearerAuth('JWT-auth')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all users (Admin)',
    description:
      'Lấy danh sách tất cả users với phân trang và sắp xếp. Chỉ admin mới có quyền.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @ApiPaginatedResponse(UserResponseDto, 'List of users retrieved successfully')
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
  })
  @ApiProtectedCommonResponses()
  getAllUsers(
    @Query()
    query: PaginationQueryDto & { sortBy?: string; sortOrder?: SortOrder },
  ) {
    return this.adminUsersService.getAllUsers(
      query.page,
      query.limit,
      query.sortBy,
      query.sortOrder,
    );
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search users (Admin)',
    description:
      'Tìm kiếm users theo email, role, isActive với phân trang. Chỉ admin mới có quyền.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm kiếm theo email',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRole,
    description: 'Lọc theo role',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: String,
    description: 'Lọc theo trạng thái (true/false)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder })
  @ApiPaginatedResponse(
    UserResponseDto,
    'Search results retrieved successfully',
  )
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  @ApiProtectedCommonResponses()
  searchUsers(
    @Query()
    query: PaginationQueryDto & {
      sortBy?: string;
      sortOrder?: SortOrder;
      search?: string;
      role?: string;
      isActive?: string;
    },
  ) {
    const isActive =
      query.isActive !== undefined
        ? query.isActive === 'true' || query.isActive === '1'
        : undefined;

    return this.adminUsersService.searchUsers(
      query.search,
      query.role,
      isActive,
      query.page,
      query.limit,
      query.sortBy,
      query.sortOrder,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID (Admin)',
    description: 'Lấy thông tin user theo ID. Chỉ admin mới có quyền.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiStandardResponse(UserResponseDto, 'User retrieved successfully', 200)
  @ApiNotFoundResponse('User not found')
  @ApiProtectedCommonResponses()
  getUserById(@Param('id') id: string) {
    return this.adminUsersService.getUserById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create user (Admin)',
    description: 'Tạo user mới. Chỉ admin mới có quyền.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiStandardResponse(UserResponseDto, 'User created successfully', 201)
  @ApiBadRequestResponse('Bad request — validation failed')
  @ApiConflictResponse('Email already exists')
  @ApiProtectedCommonResponses()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.adminUsersService.createUser(createUserDto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user (Admin)',
    description: 'Cập nhật thông tin user. Chỉ admin mới có quyền.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiStandardResponse(UserResponseDto, 'User updated successfully', 200)
  @ApiBadRequestResponse('Bad request — validation failed')
  @ApiNotFoundResponse('User not found')
  @ApiProtectedCommonResponses()
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.adminUsersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user (Admin)',
    description: 'Xóa user. Chỉ admin mới có quyền.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      allOf: [
        { $ref: '#/components/schemas/ApiResponseDto' },
        {
          properties: {
            data: { type: 'object', nullable: true, example: null },
          },
        },
      ],
    },
  })
  @ApiNotFoundResponse('User not found')
  @ApiProtectedCommonResponses()
  deleteUser(@Param('id') id: string) {
    return this.adminUsersService.deleteUser(id);
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activate user (Admin)',
    description: 'Kích hoạt user. Chỉ admin mới có quyền.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiStandardResponse(UserResponseDto, 'User activated successfully', 200)
  @ApiNotFoundResponse('User not found')
  @ApiProtectedCommonResponses()
  activateUser(@Param('id') id: string) {
    return this.adminUsersService.activateUser(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate user (Admin)',
    description: 'Vô hiệu hóa user. Chỉ admin mới có quyền.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiStandardResponse(UserResponseDto, 'User deactivated successfully', 200)
  @ApiNotFoundResponse('User not found')
  @ApiProtectedCommonResponses()
  deactivateUser(@Param('id') id: string) {
    return this.adminUsersService.deactivateUser(id);
  }
}
