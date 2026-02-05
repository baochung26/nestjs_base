# Hướng dẫn Sử dụng Storage Module

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Cấu hình](#cấu-hình)
- [Storage Service](#storage-service)
- [API Endpoints](#api-endpoints)
- [File Upload](#file-upload)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Tổng quan

Storage Module sử dụng **local file system** để lưu trữ files với các tính năng:

- ✅ Local file storage
- ✅ File upload (single & multiple)
- ✅ File download
- ✅ File deletion
- ✅ File validation (size, MIME type)
- ✅ Subfolder support
- ✅ File listing và statistics
- ✅ Security với authentication & authorization

## ⚙️ Cấu hình

### Environment Variables

Thêm vào file `.env`:

```env
# Storage Configuration
STORAGE_TYPE=local
STORAGE_LOCAL_DESTINATION=./uploads
STORAGE_MAX_FILE_SIZE=10485760          # 10MB in bytes
STORAGE_ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,application/pdf,text/plain
```

### Storage Configuration

Cấu hình mặc định:

- **Destination:** `./uploads`
- **Max File Size:** 10MB
- **Allowed MIME Types:**
  - `image/jpeg`, `image/png`, `image/gif`
  - `application/pdf`
  - `text/plain`

## 📦 Storage Service

### Inject StorageService

```typescript
import { Injectable } from '@nestjs/common';
import { StorageService } from '../infrastructure/storage/storage.service';

@Injectable()
export class YourService {
  constructor(private storageService: StorageService) {}
}
```

### Upload File

#### Single File Upload

```typescript
async uploadFile(file: Express.Multer.File) {
  const fileInfo = await this.storageService.uploadFile(file, {
    subfolder: 'documents', // Optional subfolder
    filename: 'custom-name.pdf', // Optional custom filename
  });

  return fileInfo;
}
```

#### Multiple Files Upload

```typescript
async uploadFiles(files: Express.Multer.File[]) {
  const fileInfos = await this.storageService.uploadFiles(files, {
    subfolder: 'images',
  });

  return fileInfos;
}
```

### Get File

```typescript
// Get file buffer
const fileBuffer = await this.storageService.getFile(
  'filename.pdf',
  'documents',
);

// Get file info
const fileInfo = await this.storageService.getFileInfo(
  'filename.pdf',
  'documents',
);
```

### Delete File

```typescript
// Delete single file
await this.storageService.deleteFile('filename.pdf', 'documents');

// Delete multiple files
await this.storageService.deleteFiles(['file1.pdf', 'file2.pdf'], 'documents');
```

### List Files

```typescript
// List all files in directory
const files = await this.storageService.listFiles('documents');

// List files in root
const rootFiles = await this.storageService.listFiles();
```

### Check File Exists

```typescript
const exists = await this.storageService.fileExists(
  'filename.pdf',
  'documents',
);
```

### Get Storage Statistics

```typescript
const stats = await this.storageService.getStorageStats('documents');
// Returns: { totalFiles: 10, totalSize: 1048576, files: [...] }
```

## 🌐 API Endpoints

### 1. Upload Single File

```http
POST /api/storage/upload
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

file: [binary]
subfolder: documents (optional query param)
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "message": "File uploaded successfully",
    "file": {
      "filename": "document-1234567890-abc123.pdf",
      "originalName": "document.pdf",
      "mimetype": "application/pdf",
      "size": 1048576,
      "path": "./uploads/documents/document-1234567890-abc123.pdf",
      "url": "http://localhost:3000/api/storage/files/documents/document-1234567890-abc123.pdf",
      "uploadedAt": "2024-01-19T10:30:00.000Z"
    }
  }
}
```

### 2. Upload Multiple Files

```http
POST /api/storage/upload/multiple
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

files: [binary, binary, ...]
subfolder: images (optional query param)
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "message": "Files uploaded successfully",
    "files": [
      {
        "filename": "image1-1234567890-abc123.jpg",
        "originalName": "image1.jpg",
        "mimetype": "image/jpeg",
        "size": 524288,
        "path": "./uploads/images/image1-1234567890-abc123.jpg",
        "url": "http://localhost:3000/api/storage/files/images/image1-1234567890-abc123.jpg",
        "uploadedAt": "2024-01-19T10:30:00.000Z"
      }
    ]
  }
}
```

### 3. Get File

```http
GET /api/storage/files/documents/filename.pdf
```

Returns file content with appropriate Content-Type header.

### 4. Get File Info

```http
GET /api/storage/info/documents/filename.pdf
Authorization: Bearer YOUR_TOKEN
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "filename": "filename.pdf",
    "originalName": "filename.pdf",
    "mimetype": "application/pdf",
    "size": 1048576,
    "path": "./uploads/documents/filename.pdf",
    "url": "http://localhost:3000/api/storage/files/documents/filename.pdf",
    "uploadedAt": "2024-01-19T10:30:00.000Z"
  }
}
```

### 5. List Files

```http
GET /api/storage/list?subfolder=documents
Authorization: Bearer YOUR_TOKEN
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "files": [
      {
        "filename": "file1.pdf",
        "originalName": "file1.pdf",
        "mimetype": "application/pdf",
        "size": 1048576,
        "path": "./uploads/documents/file1.pdf",
        "url": "http://localhost:3000/api/storage/files/documents/file1.pdf",
        "uploadedAt": "2024-01-19T10:30:00.000Z"
      }
    ],
    "count": 1
  }
}
```

### 6. Delete File

```http
DELETE /api/storage/files/documents/filename.pdf
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "message": "File deleted successfully"
  }
}
```

### 7. Get Storage Statistics

```http
GET /api/storage/stats?subfolder=documents
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "totalFiles": 10,
    "totalSize": 10485760,
    "files": [...]
  }
}
```

## 📤 File Upload

### Using Multer Interceptor

```typescript
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../infrastructure/storage/storage.service';

@Controller('your-controller')
export class YourController {
  constructor(private storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    const fileInfo = await this.storageService.uploadFile(file, {
      subfolder: 'user-uploads',
    });

    return fileInfo;
  }
}
```

### Multiple Files Upload

```typescript
import { FilesInterceptor } from '@nestjs/platform-express';

@Post('upload/multiple')
@UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
  const fileInfos = await this.storageService.uploadFiles(files, {
    subfolder: 'gallery',
  });

  return fileInfos;
}
```

### Custom File Validation

```typescript
import { FileValidator } from '@nestjs/common';

class CustomFileValidator extends FileValidator {
  isValid(file: Express.Multer.File): boolean {
    // Custom validation logic
    return file.size < 5 * 1024 * 1024; // 5MB
  }
}

@Post('upload')
@UseInterceptors(
  FileInterceptor('file', {
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only images allowed'), false);
      }
    },
  }),
)
async upload(@UploadedFile() file: Express.Multer.File) {
  // ...
}
```

## 💡 Best Practices

### 1. Use Subfolders for Organization

```typescript
// ✅ Good - Organized by type
await this.storageService.uploadFile(file, {
  subfolder: `users/${userId}/documents`,
});

// ❌ Bad - All files in root
await this.storageService.uploadFile(file);
```

### 2. Validate Files Before Upload

```typescript
// Validate in controller
if (!file) {
  throw new BadRequestException('No file uploaded');
}

if (file.size > 5 * 1024 * 1024) {
  throw new BadRequestException('File too large');
}
```

### 3. Sanitize Filenames

StorageService tự động generate unique filename, nhưng nếu dùng custom filename:

```typescript
// ✅ Good - Sanitized
const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
await this.storageService.uploadFile(file, { filename: sanitized });

// ❌ Bad - Unsanitized
await this.storageService.uploadFile(file, { filename: userInput });
```

### 4. Error Handling

```typescript
try {
  const fileInfo = await this.storageService.uploadFile(file);
  return fileInfo;
} catch (error) {
  if (error instanceof BadRequestException) {
    // Handle validation errors
  } else {
    // Handle other errors
    this.logger.error({ error: error.message }, 'File upload failed');
    throw error;
  }
}
```

### 5. Clean Up Old Files

```typescript
// Use scheduler to clean up old files
@Cron('0 0 * * *') // Daily
async cleanupOldFiles() {
  const files = await this.storageService.listFiles('temp');
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const file of files) {
    if (file.uploadedAt.getTime() < oneWeekAgo) {
      await this.storageService.deleteFile(file.filename, 'temp');
    }
  }
}
```

### 6. File Size Limits

```typescript
// Set appropriate limits
await this.storageService.uploadFile(file, {
  maxFileSize: 2 * 1024 * 1024, // 2MB
});
```

## 🐛 Troubleshooting

### File Upload Fails

**Nguyên nhân:** File quá lớn hoặc MIME type không được phép.

**Giải pháp:**

1. Kiểm tra file size
2. Kiểm tra MIME type trong allowed list
3. Tăng `STORAGE_MAX_FILE_SIZE` nếu cần

### Permission Denied

**Nguyên nhân:** Không có quyền write vào storage directory.

**Giải pháp:**

```bash
# Set permissions
chmod 755 ./uploads
chown -R $USER:$USER ./uploads
```

### File Not Found

**Nguyên nhân:** File đã bị xóa hoặc path sai.

**Giải pháp:**

1. Kiểm tra file có tồn tại: `await storageService.fileExists(filename)`
2. Verify subfolder path
3. Check file permissions

### Storage Full

**Nguyên nhân:** Disk space hết.

**Giải pháp:**

1. Clean up old files
2. Increase disk space
3. Implement file rotation

## 📖 Ví dụ Sử dụng

### Complete Controller với File Upload

```typescript
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../infrastructure/storage/storage.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../modules/users/entities/user.entity';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    const fileInfo = await this.storageService.uploadFile(file, {
      subfolder: `users/${user.id}/documents`,
    });

    return {
      message: 'Document uploaded successfully',
      file: fileInfo,
    };
  }

  @Get('list')
  async listDocuments(@CurrentUser() user: User) {
    const files = await this.storageService.listFiles(
      `users/${user.id}/documents`,
    );
    return { files };
  }

  @Delete(':filename')
  async deleteDocument(
    @Param('filename') filename: string,
    @CurrentUser() user: User,
  ) {
    await this.storageService.deleteFile(
      filename,
      `users/${user.id}/documents`,
    );
    return { message: 'Document deleted successfully' };
  }
}
```

## 🔗 Tài liệu liên quan

- [Multer Documentation](https://github.com/expressjs/multer)
- [NestJS File Upload](https://docs.nestjs.com/techniques/file-upload)
- [Node.js File System](https://nodejs.org/api/fs.html)
