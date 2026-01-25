import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { BaseRepository } from '../../../common/repositories/base.repository';

/**
 * Custom Repository cho User entity
 * Chứa các methods đặc thù cho User data access
 */
@Injectable()
export class UsersRepository extends BaseRepository<User> {
  protected repository: Repository<User>;

  constructor(
    @InjectRepository(User)
    userRepository: Repository<User>,
  ) {
    super();
    this.repository = userRepository;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
    });
  }

  /**
   * Find user by email with password (for authentication)
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'password',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  /**
   * Find all active users
   */
  async findActiveUsers(): Promise<User[]> {
    return this.findActive({
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  /**
   * Find all users by role
   */
  async findByRole(role: string): Promise<User[]> {
    return this.repository.find({
      where: { role } as any,
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { email },
    });
    return count > 0;
  }

  /**
   * Find user by ID with all fields (including password for admin operations)
   */
  async findByIdWithPassword(id: string): Promise<User> {
    const user = await this.repository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Find user by ID without password (for public operations)
   */
  async findByIdWithoutPassword(id: string): Promise<User> {
    const user = await this.findById(id, {
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });

    return user;
  }

  /**
   * Find all users (including inactive) with pagination and sorting
   */
  async findAllUsersPaginated(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;
    
    // Validate sortBy field - chỉ cho phép các field hợp lệ
    const allowedSortFields = ['createdAt', 'updatedAt', 'email', 'firstName', 'lastName', 'role', 'isActive'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    const [users, total] = await this.repository.findAndCount({
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
      skip,
      take: limit,
      order: {
        [validSortBy]: validSortOrder,
      },
    });

    return { users, total };
  }

  /**
   * Search users with filters, pagination and sorting
   */
  async searchUsers(
    searchTerm?: string,
    role?: string,
    isActive?: boolean,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;
    
    // Validate sortBy field
    const allowedSortFields = ['createdAt', 'updatedAt', 'email', 'firstName', 'lastName', 'role', 'isActive'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Build query builder
    const queryBuilder = this.repository.createQueryBuilder('user');
    
    // Apply search conditions
    const hasSearchTerm = searchTerm && searchTerm.trim();
    const hasRole = role && role.trim();
    const hasIsActive = isActive !== undefined;
    
    if (hasSearchTerm) {
      const searchPattern = `%${searchTerm.trim()}%`;
      queryBuilder.where(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: searchPattern },
      );
      
      if (hasRole) {
        queryBuilder.andWhere('user.role = :role', { role });
      }
      
      if (hasIsActive) {
        queryBuilder.andWhere('user.isActive = :isActive', { isActive });
      }
    } else {
      // No search term, just filters
      if (hasRole) {
        queryBuilder.where('user.role = :role', { role });
      }
      
      if (hasIsActive) {
        if (hasRole) {
          queryBuilder.andWhere('user.isActive = :isActive', { isActive });
        } else {
          queryBuilder.where('user.isActive = :isActive', { isActive });
        }
      }
    }
    
    // Apply sorting
    queryBuilder.orderBy(`user.${validSortBy}`, validSortOrder);
    
    // Apply pagination
    queryBuilder.skip(skip).take(limit);
    
    // Select only needed fields
    queryBuilder.select([
      'user.id',
      'user.email',
      'user.firstName',
      'user.lastName',
      'user.role',
      'user.isActive',
      'user.createdAt',
      'user.updatedAt',
    ]);
    
    const [users, total] = await queryBuilder.getManyAndCount();
    
    return { users, total };
  }
}
