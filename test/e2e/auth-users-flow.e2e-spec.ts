import { ExecutionContext } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { AuthController } from '../../src/modules/auth/controllers/auth.controller';
import { AuthService } from '../../src/modules/auth/services/auth.service';
import { RefreshTokenService } from '../../src/modules/auth/services/refresh-token.service';
import { UsersController } from '../../src/modules/users/controllers/users.controller';
import { UsersService } from '../../src/modules/users/services/users.service';
import { UsersRepository } from '../../src/modules/users/repositories/users.repository';
import { User, UserRole } from '../../src/modules/users/entities/user.entity';
import { CacheInterceptor } from '../../src/common/interceptors/cache.interceptor';
import { CacheEvictInterceptor } from '../../src/common/interceptors/cache-evict.interceptor';
import { ERROR_MESSAGES } from '../../src/common/constants';

const JWT_SECRET = 'test-secret';

type MutableUser = User & { password?: string };

class InMemoryUsersRepository {
  private users: MutableUser[] = [];
  private seq = 1;

  async emailExists(email: string): Promise<boolean> {
    return this.users.some((user) => user.email === email);
  }

  create(entityLike: Partial<User>): User {
    const now = new Date();
    return {
      id: `user-${this.seq++}`,
      email: entityLike.email ?? '',
      password: (entityLike as any).password ?? '',
      firstName: entityLike.firstName ?? '',
      lastName: entityLike.lastName ?? '',
      role: entityLike.role ?? UserRole.USER,
      isActive: entityLike.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    } as User;
  }

  async save(entity: MutableUser): Promise<User> {
    const index = this.users.findIndex((user) => user.id === entity.id);
    if (index >= 0) {
      this.users[index] = {
        ...this.users[index],
        ...entity,
        updatedAt: new Date(),
      };
      return { ...this.users[index] } as User;
    }

    const created = {
      ...entity,
      createdAt: entity.createdAt ?? new Date(),
      updatedAt: entity.updatedAt ?? new Date(),
    };
    this.users.push(created);
    return { ...created } as User;
  }

  async findActiveUsers(): Promise<User[]> {
    return this.users
      .filter((user) => user.isActive)
      .map((user) => this.stripPassword(user));
  }

  async findByIdWithoutPassword(id: string): Promise<User> {
    const user = this.users.find((item) => item.id === id);
    if (!user) {
      throw new Error('User not found');
    }
    return this.stripPassword(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find((item) => item.email === email);
    return user ? this.stripPassword(user) : null;
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    const user = this.users.find((item) => item.email === email);
    return user ? ({ ...user } as User) : null;
  }

  async findById(id: string): Promise<User> {
    const user = this.users.find((item) => item.id === id);
    if (!user) {
      throw new Error('User not found');
    }
    return { ...user } as User;
  }

  async remove(entity: User): Promise<User> {
    this.users = this.users.filter((user) => user.id !== entity.id);
    return entity;
  }

  private stripPassword(user: MutableUser): User {
    const safeUser = { ...user } as Partial<MutableUser>;
    delete safeUser.password;
    return safeUser as User;
  }
}

class InMemoryRefreshTokenService {
  private readonly tokens = new Map<
    string,
    { userId: string; email: string }
  >();

  async generateRefreshToken(userId: string, email: string): Promise<string> {
    const token = `${userId}:refresh`;
    this.tokens.set(token, { userId, email });
    return token;
  }

  async validateRefreshToken(refreshToken: string) {
    const payload = this.tokens.get(refreshToken);
    if (!payload) {
      return null;
    }
    return { ...payload, tokenId: 'token-1' };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    this.tokens.delete(refreshToken);
  }
}

const passthroughInterceptor = {
  intercept(
    _context: ExecutionContext,
    next: { handle: () => Observable<any> },
  ) {
    return next.handle();
  },
};

describe('Auth + Users Flow (E2E-like)', () => {
  let authController: AuthController;
  let usersController: UsersController;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const configServiceMock = {
      get: (key: string) => {
        if (key === 'jwt') {
          return {
            secret: JWT_SECRET,
            accessTokenExpiresIn: '1h',
            refreshTokenExpiresIn: '7d',
          };
        }
        if (key === 'google') {
          return { frontendURL: 'http://localhost:3001' };
        }
        return undefined;
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [AuthController, UsersController],
      providers: [
        AuthService,
        UsersService,
        Reflector,
        {
          provide: UsersRepository,
          useClass: InMemoryUsersRepository,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: RefreshTokenService,
          useClass: InMemoryRefreshTokenService,
        },
      ],
    })
      .overrideInterceptor(CacheInterceptor)
      .useValue(passthroughInterceptor)
      .overrideInterceptor(CacheEvictInterceptor)
      .useValue(passthroughInterceptor)
      .compile();

    authController = moduleFixture.get(AuthController);
    usersController = moduleFixture.get(UsersController);
    usersService = moduleFixture.get(UsersService);
    jwtService = moduleFixture.get(JwtService);
  });

  it('registers, logs in, verifies JWT payload, gets profile and updates password', async () => {
    const registerResult = await authController.register({
      email: 'e2e-user@example.com',
      password: 'password123',
      firstName: 'E2E',
      lastName: 'User',
    });

    expect(registerResult).toHaveProperty('access_token');
    expect(registerResult).toHaveProperty('refresh_token');
    expect(registerResult.email).toBe('e2e-user@example.com');

    const loginResult = await authController.login({
      email: 'e2e-user@example.com',
      password: 'password123',
    });

    expect(loginResult).toHaveProperty('access_token');
    expect(loginResult).toHaveProperty('refresh_token');

    const jwtPayload = jwtService.verify(loginResult.access_token, {
      secret: JWT_SECRET,
    });
    expect(jwtPayload.email).toBe('e2e-user@example.com');
    expect(jwtPayload.sub).toBe(loginResult.id);

    const currentUser = await usersService.findOne(jwtPayload.sub);
    const profileResult = await usersController.getProfile(currentUser as any);
    expect(profileResult.email).toBe('e2e-user@example.com');
    expect(profileResult.firstName).toBe('E2E');

    const updatedProfile = await usersController.updateProfile(
      currentUser as any,
      {
        firstName: 'Updated',
        password: 'newpassword123',
      },
    );

    expect(updatedProfile.firstName).toBe('Updated');

    const loginWithNewPassword = await authController.login({
      email: 'e2e-user@example.com',
      password: 'newpassword123',
    });
    expect(loginWithNewPassword).toHaveProperty('access_token');
  });

  it('rejects login with wrong password', async () => {
    await expect(
      authController.login({
        email: 'e2e-user@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(ERROR_MESSAGES.INVALID_CREDENTIALS);
  });
});
