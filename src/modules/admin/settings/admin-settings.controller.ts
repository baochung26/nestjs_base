import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AdminSettingsService } from './admin-settings.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApiProtectedCommonResponses, ApiBadRequestResponse } from '../../../common/decorators/api-common-responses.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminSettingsController {
  constructor(private readonly adminSettingsService: AdminSettingsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get admin settings (Admin)',
    description: 'Lấy cấu hình admin settings. Chỉ admin mới có quyền.',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings retrieved successfully',
    schema: {
      allOf: [
        { $ref: '#/components/schemas/ApiResponseDto' },
        {
          properties: {
            data: {
              type: 'object',
              properties: {
                database: { type: 'object' },
                redis: { type: 'object' },
              },
            },
          },
        },
      ],
    },
  })
  @ApiProtectedCommonResponses()
  getSettings() {
    return this.adminSettingsService.getSettings();
  }

  @Put()
  @ApiOperation({
    summary: 'Update admin settings (Admin)',
    description: 'Cập nhật cấu hình admin settings. Chỉ admin mới có quyền.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        database: { type: 'object' },
        redis: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
    schema: {
      allOf: [
        { $ref: '#/components/schemas/ApiResponseDto' },
        {
          properties: {
            data: {
              type: 'object',
              properties: {
                message: { type: 'string', example: 'Settings updated successfully' },
              },
            },
          },
        },
      ],
    },
  })
  @ApiBadRequestResponse('Bad request — validation failed')
  @ApiProtectedCommonResponses()
  updateSettings(@Body() settings: any) {
    return this.adminSettingsService.updateSettings(settings);
  }
}
