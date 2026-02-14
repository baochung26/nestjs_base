import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiExtraModels,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { UsersListResponseDto } from '../dtos/users-list-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  ApiProtectedCommonResponses,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '../../../common/decorators/api-common-responses.decorator';
import {
  ApiStandardResponse,
  ApiPaginatedResponse,
} from '../../../common/decorators/api-response.decorator';
import { User } from '../entities/user.entity';
import { CacheInterceptor } from '../../../common/interceptors/cache.interceptor';
import { Cache } from '../../../common/decorators/cache.decorator';
import { CacheEvictInterceptor } from '../../../common/interceptors/cache-evict.interceptor';
import { CacheEvict } from '../../../common/decorators/cache-evict.decorator';
import { UserRole } from '../entities/user.entity';
import { ForbiddenException } from '../../../shared/errors/custom-exceptions';
import { ERROR_MESSAGES } from '../../../common/constants';

@ApiTags('users')
@ApiExtraModels(UserResponseDto, UsersListResponseDto)
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(CacheInterceptor, CacheEvictInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Tạo user mới. Chỉ admin mới có quyền.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiStandardResponse(UserResponseDto, 'User created successfully', 201)
  @ApiBadRequestResponse('Bad request — validation failed')
  @ApiProtectedCommonResponses()
  @CacheEvict(['users:list']) // xóa cache danh sách sau khi tạo mới
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all users',
    description: 'Lấy danh sách tất cả users. Chỉ admin mới có quyền.',
  })
  @ApiPaginatedResponse(UserResponseDto, 'List of users retrieved successfully')
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
  })
  @ApiProtectedCommonResponses()
  @Cache(300, 'users:list') // cache danh sách 5 phút
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Lấy thông tin profile của user hiện tại từ JWT token. **Yêu cầu Bearer token trong header Authorization.**',
  })
  @ApiStandardResponse(
    UserResponseDto,
    'User profile retrieved successfully',
    200,
  )
  @ApiProtectedCommonResponses()
  getProfile(@CurrentUser() user: User) {
    return this.usersService.findOne(user.id);
  }

  @Patch('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update current user profile',
    description:
      'Cập nhật thông tin profile của user hiện tại. Chỉ được sửa firstName, lastName, password. **Yêu cầu Bearer token trong header Authorization.**',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiStandardResponse(UserResponseDto, 'Profile updated successfully', 200)
  @ApiBadRequestResponse('Bad request — validation failed')
  @ApiProtectedCommonResponses()
  updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get user by ID',
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
  @Cache(600) // cache 10 phút, key tự sinh theo url/params/user
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update user by ID',
    description: 'Cập nhật thông tin user theo ID. Chỉ admin mới có quyền.',
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
  @CacheEvict(['users:list']) // xóa cache danh sách sau khi update
  @CacheEvict() // xóa cache GET /users/:id (key tự sinh) sau khi update
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ) {
    if (id === currentUser.id && updateUserDto.isActive === false) {
      throw new ForbiddenException(ERROR_MESSAGES.CANNOT_DEACTIVATE_SELF);
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete user by ID',
    description: 'Xóa user theo ID. Chỉ admin mới có quyền.',
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
  @CacheEvict(['users:list']) // xóa cache danh sách sau khi delete
  @CacheEvict() // xóa cache GET /users/:id (key tự sinh) sau khi delete
  remove(@Param('id') id: string) {
    return this.usersService.removeById(id);
  }
}
