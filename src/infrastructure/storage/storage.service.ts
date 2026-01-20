import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

export interface FileInfo {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  uploadedAt: Date;
}

export interface StorageOptions {
  subfolder?: string;
  filename?: string;
  allowedMimeTypes?: string[];
  maxFileSize?: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storagePath: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(private configService: ConfigService) {
    const storage = this.configService.get('storage');
    this.storagePath = storage?.local?.destination || './uploads';
    this.maxFileSize = storage?.local?.maxFileSize || 10485760; // 10MB
    this.allowedMimeTypes = storage?.local?.allowedMimeTypes || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
    ];

    // Ensure storage directory exists
    this.ensureStorageDirectory();
  }

  /**
   * Ensure storage directory exists
   */
  private async ensureStorageDirectory() {
    try {
      await access(this.storagePath);
    } catch {
      await mkdir(this.storagePath, { recursive: true });
      this.logger.log(`Storage directory created at ${this.storagePath}`);
    }
  }

  /**
   * Validate file
   */
  private validateFile(file: Express.Multer.File, options?: StorageOptions): void {
    // Check file size
    const maxSize = options?.maxFileSize || this.maxFileSize;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      );
    }

    // Check MIME type
    const allowedTypes = options?.allowedMimeTypes || this.allowedMimeTypes;
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }
  }

  /**
   * Generate unique filename
   */
  private generateFilename(originalName: string, customName?: string): string {
    if (customName) {
      return customName;
    }

    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);

    return `${name}-${timestamp}-${random}${ext}`;
  }

  /**
   * Get storage path for subfolder
   */
  private getStoragePath(subfolder?: string): string {
    if (subfolder) {
      const fullPath = path.join(this.storagePath, subfolder);
      return fullPath;
    }
    return this.storagePath;
  }

  /**
   * Upload file
   */
  async uploadFile(
    file: Express.Multer.File,
    options?: StorageOptions,
  ): Promise<FileInfo> {
    this.validateFile(file, options);

    const subfolder = options?.subfolder || '';
    const storagePath = this.getStoragePath(subfolder);

    // Ensure subfolder exists
    try {
      await access(storagePath);
    } catch {
      await mkdir(storagePath, { recursive: true });
    }

    const filename = this.generateFilename(file.originalname, options?.filename);
    const filePath = path.join(storagePath, filename);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    const fileInfo: FileInfo = {
      filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: filePath,
      url: this.getFileUrl(subfolder, filename),
      uploadedAt: new Date(),
    };

    this.logger.log(
      `File uploaded successfully: ${filename} (${file.size} bytes, ${file.mimetype})`,
    );

    return fileInfo;
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: Express.Multer.File[],
    options?: StorageOptions,
  ): Promise<FileInfo[]> {
    const results = await Promise.all(
      files.map((file) => this.uploadFile(file, options)),
    );

    this.logger.log(`Multiple files uploaded: ${results.length} files`);
    return results;
  }

  /**
   * Get file
   */
  async getFile(filename: string, subfolder?: string): Promise<Buffer> {
    const storagePath = this.getStoragePath(subfolder);
    const filePath = path.join(storagePath, filename);

    try {
      await access(filePath);
      return fs.readFileSync(filePath);
    } catch {
      throw new NotFoundException(`File ${filename} not found`);
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(filename: string, subfolder?: string): Promise<FileInfo> {
    const storagePath = this.getStoragePath(subfolder);
    const filePath = path.join(storagePath, filename);

    try {
      const stats = await stat(filePath);
      const ext = path.extname(filename);
      const mimetype = this.getMimeType(ext);

      return {
        filename,
        originalName: filename,
        mimetype,
        size: stats.size,
        path: filePath,
        url: this.getFileUrl(subfolder, filename),
        uploadedAt: stats.birthtime,
      };
    } catch {
      throw new NotFoundException(`File ${filename} not found`);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filename: string, subfolder?: string): Promise<void> {
    const storagePath = this.getStoragePath(subfolder);
    const filePath = path.join(storagePath, filename);

    try {
      await unlink(filePath);
      this.logger.log(`File deleted successfully: ${filename}`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new NotFoundException(`File ${filename} not found`);
      }
      throw error;
    }
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(filenames: string[], subfolder?: string): Promise<void> {
    await Promise.all(filenames.map((filename) => this.deleteFile(filename, subfolder)));
    this.logger.log(`Multiple files deleted: ${filenames.length} files`);
  }

  /**
   * List files in directory
   */
  async listFiles(subfolder?: string): Promise<FileInfo[]> {
    const storagePath = this.getStoragePath(subfolder);

    try {
      const files = await readdir(storagePath);
      const fileInfos = await Promise.all(
        files.map((file) => this.getFileInfo(file, subfolder)),
      );

      return fileInfos;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get file URL
   */
  getFileUrl(subfolder?: string, filename?: string): string {
    const app = this.configService.get('app');
    const baseUrl = app?.frontendUrl || 'http://localhost:3000';
    const apiPrefix = app?.prefix || 'api';
    const path = subfolder ? `${subfolder}/${filename}` : filename;
    return `${baseUrl}/${apiPrefix}/storage/files/${path}`;
  }

  /**
   * Get MIME type from extension
   */
  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.json': 'application/json',
    };

    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Check if file exists
   */
  async fileExists(filename: string, subfolder?: string): Promise<boolean> {
    const storagePath = this.getStoragePath(subfolder);
    const filePath = path.join(storagePath, filename);

    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(subfolder?: string): Promise<{
    totalFiles: number;
    totalSize: number;
    files: FileInfo[];
  }> {
    const files = await this.listFiles(subfolder);
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    return {
      totalFiles: files.length,
      totalSize,
      files,
    };
  }
}
