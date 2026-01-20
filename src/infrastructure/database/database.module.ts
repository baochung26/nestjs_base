import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { databaseConfig } from '../../config/configuration';
import { User } from '../../modules/users/entities/user.entity';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forFeature(databaseConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        const isProduction = configService.get('app.env') === 'production';

        return {
          type: 'postgres',
          host: dbConfig?.host || process.env.DB_HOST || 'localhost',
          port: dbConfig?.port || parseInt(process.env.DB_PORT || '5432', 10),
          username: dbConfig?.username || process.env.DB_USER || 'postgres',
          password: dbConfig?.password || process.env.DB_PASSWORD || 'postgres',
          database: dbConfig?.database || process.env.DB_NAME || 'nestjs_db',
          entities: [join(__dirname, '../../**/*.entity{.ts,.js}')],
          migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
          synchronize: !isProduction && (dbConfig?.synchronize ?? true),
          logging: dbConfig?.logging ?? (!isProduction),
          migrationsRun: false,
          migrationsTableName: 'migrations',
          // Connection pooling
          extra: {
            max: 10, // Maximum number of connections in the pool
            min: 2, // Minimum number of connections in the pool
            idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
            connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
          },
          // SSL configuration (for production)
          ...(isProduction && process.env.DB_SSL === 'true' && {
            ssl: {
              rejectUnauthorized: false,
            },
          }),
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
