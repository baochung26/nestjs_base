import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { UserDto } from '../dtos/user.dto';
import { UsersRepository } from '../repositories/users.repository';
import { UserMapper } from '../mappers/user.mapper';
import { BaseService } from '../../../common/services/base.service';
import { ConflictException } from '../../../shared/errors/custom-exceptions';
import { ERROR_MESSAGES } from '../../../common/constants';

@Injectable()
export class UsersService extends BaseService<User> {
  private readonly logger = new Logger(UsersService.name);
  private readonly userMapper = new UserMapper();

  constructor(protected readonly usersRepository: UsersRepository) {
    super(usersRepository);
  }

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    this.logger.debug({ email: createUserDto.email }, 'Creating new user');

    const emailExists = await this.usersRepository.emailExists(
      createUserDto.email,
    );

    if (emailExists) {
      this.logger.warn(
        { email: createUserDto.email },
        'User creation failed: email already exists',
      );
      throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Use mapper to convert DTO to entity
    const userData = this.userMapper.toEntity(createUserDto);
    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);
    this.logger.log(
      `User created successfully: ${savedUser.email} (ID: ${savedUser.id})`,
    );

    // Convert entity to DTO for response
    return this.userMapper.toDto(savedUser);
  }

  async findAll(): Promise<UserDto[]> {
    const users = await this.usersRepository.findActiveUsers();
    return this.userMapper.toDtoArray(users);
  }

  async findOne(id: string): Promise<UserDto> {
    this.logger.debug({ userId: id }, 'Finding user by ID');
    const user = await this.usersRepository.findByIdWithoutPassword(id);
    return this.userMapper.toDto(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository.findByEmailWithPassword(email);
  }

  /**
   * User tự cập nhật profile: chỉ firstName, lastName, password.
   * Không cho phép sửa email, role, isActive.
   */
  async updateProfile(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserDto> {
    const user = await this.usersRepository.findByIdWithoutPassword(id);

    const updates: Partial<User> = {};
    if (updateProfileDto.firstName !== undefined)
      updates.firstName = updateProfileDto.firstName;
    if (updateProfileDto.lastName !== undefined)
      updates.lastName = updateProfileDto.lastName;
    if (updateProfileDto.password) {
      updates.password = await bcrypt.hash(updateProfileDto.password, 10);
    }

    if (Object.keys(updates).length === 0) {
      return this.userMapper.toDto(user);
    }

    Object.assign(user, updates);
    const updatedUser = await this.usersRepository.save(user);
    this.logger.debug({ userId: id }, 'Profile updated');
    return this.userMapper.toDto(updatedUser);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const user = await this.usersRepository.findByIdWithoutPassword(id);
    const hashedPassword = updateUserDto.password
      ? await bcrypt.hash(updateUserDto.password, 10)
      : undefined;

    // Use mapper to convert DTO to entity
    const userData = this.userMapper.toEntityFromUpdate(updateUserDto);
    const updates: Partial<User> = {
      ...userData,
      ...(hashedPassword ? { password: hashedPassword } : {}),
    };

    if (Object.keys(updates).length === 0) {
      return this.userMapper.toDto(user);
    }

    Object.assign(user, updates);
    const updatedUser = await this.usersRepository.save(user);
    // Convert entity to DTO for response
    return this.userMapper.toDto(updatedUser);
  }

  async findOrCreateGoogleUser(googleProfile: {
    email: string;
    firstName: string;
    lastName: string;
    picture?: string;
  }): Promise<User> {
    // Return User entity (not DTO) for internal use (auth service needs full entity)
    let user = await this.usersRepository.findByEmail(googleProfile.email);

    if (!user) {
      // Tạo password ngẫu nhiên cho user Google (sẽ không bao giờ được dùng)
      const randomPassword = await bcrypt.hash(
        Math.random().toString(36).slice(-8),
        10,
      );

      user = this.usersRepository.create({
        email: googleProfile.email,
        password: randomPassword,
        firstName: googleProfile.firstName,
        lastName: googleProfile.lastName,
      });

      user = await this.usersRepository.save(user);
    }

    return user;
  }
}
