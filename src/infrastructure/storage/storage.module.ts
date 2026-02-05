import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { storageConfig } from '../../config/configuration';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';

@Global()
@Module({
  imports: [ConfigModule.forFeature(storageConfig)],
  providers: [StorageService],
  controllers: [StorageController],
  exports: [StorageService],
})
export class StorageModule {}
