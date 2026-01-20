import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/services/users.service';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { User } from '../../users/entities/user.entity';
import { UnauthorizedException } from '../../../shared/errors/custom-exceptions';
import { ERROR_MESSAGES } from '../../../common/constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async register(registerDto: RegisterDto) {
    this.logger.debug(`Registering new user: ${registerDto.email}`);

    const userDto = await this.usersService.create(registerDto);
    
    // Get full user entity for token generation
    const user = await this.usersService.findByEmail(userDto.email);
    if (!user) {
      throw new Error('User not found after creation');
    }

    this.logger.log(`User registered successfully: ${userDto.email} (ID: ${userDto.id})`);
    return {
      ...userDto,
      access_token: this.generateToken(user),
    };
  }

  async login(loginDto: LoginDto) {
    this.logger.debug(`Attempting user login: ${loginDto.email}`);

    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      this.logger.warn(`Login failed: invalid credentials for ${loginDto.email}`);
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    this.logger.log(`User logged in successfully: ${user.email} (ID: ${user.id})`);
    return {
      ...user,
      access_token: this.generateToken(user),
    };
  }

  async googleLogin(googleUser: {
    email: string;
    firstName: string;
    lastName: string;
    picture?: string;
  }) {
    const user = await this.usersService.findOrCreateGoogleUser(googleUser);
    const { password, ...result } = user;

    return {
      ...result,
      access_token: this.generateToken(user),
    };
  }

  private generateToken(user: User): string {
    const jwt = this.configService.get('jwt');
    const payload = { email: user.email, sub: user.id, role: user.role };
    return this.jwtService.sign(payload, {
      secret: jwt?.secret || 'your-secret-key',
      expiresIn: jwt?.expiresIn || '7d',
    });
  }
}
