import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
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
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async register(registerDto: RegisterDto) {
    this.logger.debug({ email: registerDto.email }, 'Registering new user');

    const user = await this.usersService.create(registerDto);
    const { password, ...result } = user;

    this.logger.info({ userId: user.id, email: user.email }, 'User registered successfully');
    return {
      ...result,
      access_token: this.generateToken(user),
    };
  }

  async login(loginDto: LoginDto) {
    this.logger.debug({ email: loginDto.email }, 'Attempting user login');

    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      this.logger.warn({ email: loginDto.email }, 'Login failed: invalid credentials');
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    this.logger.info({ userId: user.id, email: user.email }, 'User logged in successfully');
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
