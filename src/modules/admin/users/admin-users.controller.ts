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
import { AdminUsersService } from './admin-users.service';
import { CreateUserDto } from '../../users/dtos/create-user.dto';
import { UpdateUserDto } from '../../users/dtos/update-user.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { PaginationQueryDto, SortOrder } from '../../../shared/pagination/pagination.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  getAllUsers(
    @Query() query: PaginationQueryDto & { sortBy?: string; sortOrder?: SortOrder },
  ) {
    return this.adminUsersService.getAllUsers(
      query.page,
      query.limit,
      query.sortBy,
      query.sortOrder,
    );
  }

  @Get('search')
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
    // Parse isActive from string to boolean
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
  getUserById(@Param('id') id: string) {
    return this.adminUsersService.getUserById(id);
  }

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.adminUsersService.createUser(createUserDto);
  }

  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.adminUsersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.adminUsersService.deleteUser(id);
  }

  @Patch(':id/activate')
  activateUser(@Param('id') id: string) {
    return this.adminUsersService.activateUser(id);
  }

  @Patch(':id/deactivate')
  deactivateUser(@Param('id') id: string) {
    return this.adminUsersService.deactivateUser(id);
  }
}
