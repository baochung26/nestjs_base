import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiExtraModels, ApiParam } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { UsersListResponseDto } from '../dtos/users-list-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ApiProtectedCommonResponses, ApiBadRequestResponse } from '../../../common/decorators/api-common-responses.decorator';
import { User } from '../entities/user.entity';

@ApiTags('users')
@ApiExtraModels(UserResponseDto, UsersListResponseDto)
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user', description: 'Tạo user mới. Yêu cầu JWT token.' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, type: UserResponseDto, description: 'User created successfully' })
  @ApiBadRequestResponse('Bad request — validation failed')
  @ApiProtectedCommonResponses()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users', description: 'Lấy danh sách tất cả users. Yêu cầu JWT token.' })
  @ApiResponse({ status: 200, type: UsersListResponseDto, description: 'List of users retrieved successfully' })
  @ApiProtectedCommonResponses()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Lấy thông tin profile của user hiện tại từ JWT token. **Yêu cầu Bearer token trong header Authorization.**',
  })
  @ApiResponse({ status: 200, type: UserResponseDto, description: 'User profile retrieved successfully' })
  @ApiProtectedCommonResponses()
  getProfile(@CurrentUser() user: User) {
    return this.usersService.findOne(user.id);
  }

  @Patch('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Cập nhật thông tin profile của user hiện tại. Chỉ được sửa firstName, lastName, password. **Yêu cầu Bearer token trong header Authorization.**',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, type: UserResponseDto, description: 'Profile updated successfully' })
  @ApiBadRequestResponse('Bad request — validation failed')
  @ApiProtectedCommonResponses()
  updateProfile(@CurrentUser() user: User, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID', description: 'Lấy thông tin user theo ID. Yêu cầu JWT token.' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, type: UserResponseDto, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiProtectedCommonResponses()
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID', description: 'Cập nhật thông tin user theo ID. Yêu cầu JWT token.' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, type: UserResponseDto, description: 'User updated successfully' })
  @ApiBadRequestResponse('Bad request — validation failed')
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiProtectedCommonResponses()
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID', description: 'Xóa user theo ID. Yêu cầu JWT token.' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiProtectedCommonResponses()
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
