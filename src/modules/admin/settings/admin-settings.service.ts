import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminSettingsService {
  constructor(private configService: ConfigService) {}

  async getSettings() {
    const dbConfig = this.configService.get('database');
    const jwt = this.configService.get('jwt');

    return {
      appName: 'NestJS Demo',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        host: dbConfig?.host || process.env.DB_HOST,
        port: dbConfig?.port || process.env.DB_PORT,
        name: dbConfig?.database || process.env.DB_NAME,
      },
      jwt: {
        expiresIn: jwt?.expiresIn || process.env.JWT_EXPIRES_IN,
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
