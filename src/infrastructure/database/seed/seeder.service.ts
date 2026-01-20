import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async seed() {
    this.logger.log('Starting database seeding...');

    try {
      await this.seedUsers();
      this.logger.log('Database seeding completed successfully!');
    } catch (error) {
      this.logger.error('Error seeding database:', error);
      throw error;
    }
  }

  async seedUsers() {
    this.logger.log('Seeding users...');

    const users = [
      {
        email: 'admin@example.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true,
      },
      {
        email: 'user@example.com',
        password: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
        isActive: true,
      },
      {
        email: 'jane@example.com',
        password: 'user123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.USER,
        isActive: true,
      },
      {
        email: 'inactive@example.com',
        password: 'user123',
        firstName: 'Inactive',
        lastName: 'User',
        role: UserRole.USER,
        isActive: false,
      },
    ];

    for (const userData of users) {
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        this.logger.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = this.userRepository.create({
        ...userData,
        password: hashedPassword,
      });

      await this.userRepository.save(user);
      this.logger.log(`Created user: ${userData.email}`);
    }

    this.logger.log('Users seeding completed!');
  }

  async clear() {
    this.logger.log('Clearing database...');

    try {
      await this.userRepository.delete({});
      this.logger.log('Database cleared successfully!');
    } catch (error) {
      this.logger.error('Error clearing database:', error);
      throw error;
    }
  }

  async refresh() {
    this.logger.log('Refreshing database (clear + seed)...');
    await this.clear();
    await this.seed();
  }
}
