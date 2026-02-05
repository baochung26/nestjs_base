import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminDashboardService } from './admin-dashboard.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApiProtectedCommonResponses } from '../../../common/decorators/api-common-responses.decorator';
import { CacheInterceptor } from '../../../common/interceptors/cache.interceptor';
import { Cache } from '../../../common/decorators/cache.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@UseInterceptors(CacheInterceptor)
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Get dashboard statistics (Admin)',
    description:
      'Lấy thống kê tổng quan cho admin dashboard. Chỉ admin mới có quyền.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    schema: {
      allOf: [
        { $ref: '#/components/schemas/ApiResponseDto' },
        {
          properties: {
            data: {
              type: 'object',
              properties: {
                totalUsers: { type: 'number', example: 100 },
                activeUsers: { type: 'number', example: 85 },
                totalAdmins: { type: 'number', example: 5 },
              },
            },
          },
        },
      ],
    },
  })
  @ApiProtectedCommonResponses()
  @Cache(300, 'admin:dashboard:stats') // Cache 5 phút, key chung cho mọi admin
  getStatistics() {
    return this.adminDashboardService.getStatistics();
  }
}
