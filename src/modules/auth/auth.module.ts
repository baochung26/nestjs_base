import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { jwtConfig } from '../../config/configuration';
import { AuthService } from './services/auth.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { AuthController } from './controllers/auth.controller';
import { UsersModule } from '../users/users.module';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    CacheModule,
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwt = configService.get('jwt');
        return {
          secret: jwt?.secret || process.env.JWT_SECRET || 'your-secret-key',
          signOptions: {
            expiresIn:
              jwt?.accessTokenExpiresIn ||
              jwt?.expiresIn ||
              process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ||
              '15m',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RefreshTokenService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
  ],
  exports: [AuthService, RefreshTokenService],
})
export class AuthModule {}
