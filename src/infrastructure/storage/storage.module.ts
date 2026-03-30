import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { storageConfig } from '../../config/configuration';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(storageConfig),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const storage = configService.get('storage');
        const maxFileSize = storage?.local?.maxFileSize || 10485760;

        return {
          storage: memoryStorage(),
          limits: {
            fileSize: maxFileSize,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [StorageService],
  controllers: [StorageController],
  exports: [StorageService],
})
export class StorageModule {}
