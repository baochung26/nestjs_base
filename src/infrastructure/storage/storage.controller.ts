import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../modules/users/entities/user.entity';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * Upload single file
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('subfolder') subfolder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileInfo = await this.storageService.uploadFile(file, {
      subfolder,
    });

    return {
      message: 'File uploaded successfully',
      file: fileInfo,
    };
  }

  /**
   * Upload multiple files
   */
  @Post('upload/multiple')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('subfolder') subfolder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const fileInfos = await this.storageService.uploadFiles(files, {
      subfolder,
    });

    return {
      message: 'Files uploaded successfully',
      files: fileInfos,
    };
  }

  /**
   * Get file (public access)
   */
  @Get('files/*')
  async getFile(
    @Param('0') path: string,
    @Res() res: Response,
  ) {
    const parts = path.split('/');
    const filename = parts[parts.length - 1];
    const subfolder = parts.length > 1 ? parts.slice(0, -1).join('/') : undefined;

    const file = await this.storageService.getFile(filename, subfolder);
    const fileInfo = await this.storageService.getFileInfo(filename, subfolder);

    res.setHeader('Content-Type', fileInfo.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${fileInfo.originalName}"`);
    res.send(file);
  }

  /**
   * Get file info
   */
  @Get('info/*')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  async getFileInfo(@Param('0') path: string) {
    const parts = path.split('/');
    const filename = parts[parts.length - 1];
    const subfolder = parts.length > 1 ? parts.slice(0, -1).join('/') : undefined;

    const fileInfo = await this.storageService.getFileInfo(filename, subfolder);
    return fileInfo;
  }

  /**
   * List files
   */
  @Get('list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  async listFiles(@Query('subfolder') subfolder?: string) {
    const files = await this.storageService.listFiles(subfolder);
    return {
      files,
      count: files.length,
    };
  }

  /**
   * Delete file
   */
  @Delete('files/*')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteFile(@Param('0') path: string) {
    const parts = path.split('/');
    const filename = parts[parts.length - 1];
    const subfolder = parts.length > 1 ? parts.slice(0, -1).join('/') : undefined;

    await this.storageService.deleteFile(filename, subfolder);
    return {
      message: 'File deleted successfully',
    };
  }

  /**
   * Get storage statistics
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStorageStats(@Query('subfolder') subfolder?: string) {
    const stats = await this.storageService.getStorageStats(subfolder);
    return stats;
  }
}
