import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../../src/modules/users/services/users.service';
import { UsersRepository } from '../../../src/modules/users/repositories/users.repository';
import {
  User,
  UserRole,
} from '../../../src/modules/users/entities/user.entity';
import { ConflictException } from '../../../src/shared/errors/custom-exceptions';
import { ERROR_MESSAGES } from '../../../src/common/constants';

const mockUsersRepository = () => ({
  emailExists: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findActiveUsers: jest.fn(),
  findByIdWithoutPassword: jest.fn(),
  findByEmail: jest.fn(),
  findByEmailWithPassword: jest.fn(),
  findById: jest.fn(),
  remove: jest.fn(),
});

const fixedDate = new Date('2026-02-05T00:00:00.000Z');
const buildUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'john@example.com',
    password: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.USER,
    isActive: true,
    createdAt: fixedDate,
    updatedAt: fixedDate,
    ...overrides,
  }) as User;

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: ReturnType<typeof mockUsersRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useFactory: mockUsersRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(UsersRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      const users = [buildUser()];
      usersRepository.findActiveUsers.mockResolvedValue(users);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(usersRepository.findActiveUsers).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const dto = {
        email: 'new-user@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };
      const createdEntity = { ...dto } as Partial<User>;
      const savedUser = buildUser({
        id: 'user-2',
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });

      usersRepository.emailExists.mockResolvedValue(false);
      usersRepository.create.mockReturnValue(createdEntity);
      usersRepository.save.mockResolvedValue(savedUser);

      const result = await service.create(dto);

      expect(usersRepository.emailExists).toHaveBeenCalledWith(dto.email);
      const createdArg = usersRepository.create.mock.calls[0][0];
      expect(createdArg.password).not.toBe(dto.password);
      await expect(
        bcrypt.compare(dto.password, createdArg.password),
      ).resolves.toBe(true);
      expect(result).toMatchObject({
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
      });
      expect((result as any).password).toBeUndefined();
    });

    it('should throw conflict exception when email already exists', async () => {
      usersRepository.emailExists.mockResolvedValue(true);

      await expect(
        service.create({
          email: 'john@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        }),
      ).rejects.toThrow(ConflictException);

      await expect(
        service.create({
          email: 'john@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        }),
      ).rejects.toThrow(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    });
  });

  describe('updateProfile', () => {
    it('should return current user when dto has no allowed fields', async () => {
      const existingUser = buildUser();
      usersRepository.findByIdWithoutPassword.mockResolvedValue(existingUser);

      const result = await service.updateProfile(existingUser.id, {});

      expect(usersRepository.save).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        id: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
      });
    });

    it('should update firstName and password for profile', async () => {
      const existingUser = buildUser();
      const savedUser = buildUser({
        firstName: 'Johnny',
      });
      usersRepository.findByIdWithoutPassword.mockResolvedValue(existingUser);
      usersRepository.save.mockResolvedValue(savedUser);

      const result = await service.updateProfile(existingUser.id, {
        firstName: 'Johnny',
        password: 'newpassword123',
      });

      const savedArg = usersRepository.save.mock.calls[0][0] as User;
      expect(savedArg.firstName).toBe('Johnny');
      await expect(
        bcrypt.compare('newpassword123', savedArg.password),
      ).resolves.toBe(true);
      expect(result.firstName).toBe('Johnny');
    });
  });

  describe('update', () => {
    it('should update user fields without password hashing when password is missing', async () => {
      const existingUser = buildUser();
      const savedUser = buildUser({
        firstName: 'Alice',
        isActive: false,
      });
      usersRepository.findByIdWithoutPassword.mockResolvedValue(existingUser);
      usersRepository.save.mockResolvedValue(savedUser);

      const result = await service.update(existingUser.id, {
        firstName: 'Alice',
        isActive: false,
      });

      const savedArg = usersRepository.save.mock.calls[0][0] as User;
      expect(savedArg.firstName).toBe('Alice');
      expect(savedArg.isActive).toBe(false);
      expect(result.firstName).toBe('Alice');
      expect(result.isActive).toBe(false);
    });

    it('should hash password when updating user password', async () => {
      const existingUser = buildUser();
      const savedUser = buildUser();
      usersRepository.findByIdWithoutPassword.mockResolvedValue(existingUser);
      usersRepository.save.mockResolvedValue(savedUser);

      await service.update(existingUser.id, {
        password: 'resetPassword123',
      });

      const savedArg = usersRepository.save.mock.calls[0][0] as User;
      await expect(
        bcrypt.compare('resetPassword123', savedArg.password),
      ).resolves.toBe(true);
    });

    it('should return current user when update dto is empty', async () => {
      const existingUser = buildUser();
      usersRepository.findByIdWithoutPassword.mockResolvedValue(existingUser);

      const result = await service.update(existingUser.id, {});

      expect(usersRepository.save).not.toHaveBeenCalled();
      expect(result.id).toBe(existingUser.id);
    });
  });

  describe('findOne and proxy methods', () => {
    it('should map user in findOne', async () => {
      const existingUser = buildUser();
      usersRepository.findByIdWithoutPassword.mockResolvedValue(existingUser);

      const result = await service.findOne(existingUser.id);

      expect(usersRepository.findByIdWithoutPassword).toHaveBeenCalledWith(
        existingUser.id,
      );
      expect(result).toMatchObject({
        id: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.firstName,
      });
    });

    it('should proxy findByEmail to repository', async () => {
      const user = buildUser();
      usersRepository.findByEmail.mockResolvedValue(user);

      const result = await service.findByEmail(user.email);

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(user.email);
      expect(result).toEqual(user);
    });

    it('should proxy findByEmailWithPassword to repository', async () => {
      const user = buildUser();
      usersRepository.findByEmailWithPassword.mockResolvedValue(user);

      const result = await service.findByEmailWithPassword(user.email);

      expect(usersRepository.findByEmailWithPassword).toHaveBeenCalledWith(
        user.email,
      );
      expect(result).toEqual(user);
    });
  });

  describe('findOrCreateGoogleUser', () => {
    it('should return existing user when email already exists', async () => {
      const existingUser = buildUser({ email: 'google@example.com' });
      usersRepository.findByEmail.mockResolvedValue(existingUser);

      const result = await service.findOrCreateGoogleUser({
        email: 'google@example.com',
        firstName: 'G',
        lastName: 'User',
      });

      expect(result).toEqual(existingUser);
      expect(usersRepository.create).not.toHaveBeenCalled();
      expect(usersRepository.save).not.toHaveBeenCalled();
    });

    it('should create new user when email does not exist', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockImplementation((input) => input);
      const savedUser = buildUser({ email: 'new-google@example.com' });
      usersRepository.save.mockResolvedValue(savedUser);

      const result = await service.findOrCreateGoogleUser({
        email: 'new-google@example.com',
        firstName: 'New',
        lastName: 'Google',
      });

      const createdArg = usersRepository.create.mock.calls[0][0];
      expect(createdArg.email).toBe('new-google@example.com');
      expect(createdArg.password).toBeDefined();
      expect(createdArg.password.length).toBeGreaterThan(10);
      expect(result).toEqual(savedUser);
    });
  });
});
