import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminSettingsService {
  constructor(private configService: ConfigService) {}

  async getSettings() {
    return {
      appName: 'NestJS Demo',
      version: '1.0.0',
      environment: this.configService.get('NODE_ENV', 'development'),
      database: {
        host: this.configService.get('DB_HOST'),
        port: this.configService.get('DB_PORT'),
        name: this.configService.get('DB_NAME'),
      },
      jwt: {
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '7d'),
      },
    };
  }

  async updateSettings(settings: any) {
    // In a real application, you would save these settings to a database
    // For now, we'll just return the settings
    return {
      message: 'Settings updated successfully',
      settings,
    };
  }
}
