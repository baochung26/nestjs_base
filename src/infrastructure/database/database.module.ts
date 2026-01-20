import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { databaseConfig } from '../../config/configuration';
import { User } from '../../modules/users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forFeature(databaseConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        return {
          type: 'postgres',
          host: dbConfig?.host || process.env.DB_HOST || 'localhost',
          port: dbConfig?.port || parseInt(process.env.DB_PORT || '5432', 10),
          username: dbConfig?.username || process.env.DB_USER || 'postgres',
          password: dbConfig?.password || process.env.DB_PASSWORD || 'postgres',
          database: dbConfig?.database || process.env.DB_NAME || 'nestjs_db',
          entities: [User],
          synchronize: dbConfig?.synchronize ?? (process.env.NODE_ENV !== 'production'),
          logging: dbConfig?.logging ?? (process.env.NODE_ENV === 'development'),
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
