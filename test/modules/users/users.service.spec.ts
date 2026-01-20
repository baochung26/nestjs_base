import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from '../../../src/modules/users/services/users.service';
import { UsersRepository } from '../../../src/modules/users/repositories/users.repository';
import { User } from '../../../src/modules/users/entities/user.entity';
import { Logger } from 'nestjs-pino';

const mockUsersRepository = () => ({
  emailExists: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findActiveUsers: jest.fn(),
  findByIdWithoutPassword: jest.fn(),
});

const mockLogger = () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: ReturnType<typeof mockUsersRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useFactory: mockUsersRepository },
        { provide: Logger, useFactory: mockLogger },
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
      const users = [
        { id: '1', email: 'test@example.com', firstName: 'John', lastName: 'Doe' } as User,
      ];
      usersRepository.findActiveUsers.mockResolvedValue(users);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(usersRepository.findActiveUsers).toHaveBeenCalled();
    });
  });
});
