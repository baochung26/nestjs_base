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
import { ApiProtectedCommonResponses, ApiBadRequestResponse, ApiNotFoundResponse } from '../../../common/decorators/api-common-responses.decorator';
import { ApiStandardResponse, ApiPaginatedResponse } from '../../../common/decorators/api-response.decorator';
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
  @ApiStandardResponse(UserResponseDto, 'User created successfully', 201)
  @ApiBadRequestResponse('Bad request — validation failed')
  @ApiProtectedCommonResponses()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users', description: 'Lấy danh sách tất cả users. Yêu cầu JWT token.' })
  @ApiPaginatedResponse(UserResponseDto, 'List of users retrieved successfully')
  @ApiResponse({ status: 200, description: 'List of users retrieved successfully' })
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
  @ApiStandardResponse(UserResponseDto, 'User profile retrieved successfully', 200)
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
  @ApiStandardResponse(UserResponseDto, 'Profile updated successfully', 200)
  @ApiBadRequestResponse('Bad request — validation failed')
  @ApiProtectedCommonResponses()
  updateProfile(@CurrentUser() user: User, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID', description: 'Lấy thông tin user theo ID. Yêu cầu JWT token.' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiStandardResponse(UserResponseDto, 'User retrieved successfully', 200)
  @ApiNotFoundResponse('User not found')
  @ApiProtectedCommonResponses()
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID', description: 'Cập nhật thông tin user theo ID. Yêu cầu JWT token.' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: UpdateUserDto })
  @ApiStandardResponse(UserResponseDto, 'User updated successfully', 200)
  @ApiBadRequestResponse('Bad request — validation failed')
  @ApiNotFoundResponse('User not found')
  @ApiProtectedCommonResponses()
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID', description: 'Xóa user theo ID. Yêu cầu JWT token.' })
  @ApiParam({ name: 'id', description: 'User ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ 
    status: 200, 
    description: 'User deleted successfully',
    schema: {
      allOf: [
        { $ref: '#/components/schemas/ApiResponseDto' },
        {
          properties: {
            data: { type: 'object', nullable: true, example: null }
          }
        }
      ]
    }
  })
  @ApiNotFoundResponse('User not found')
  @ApiProtectedCommonResponses()
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
