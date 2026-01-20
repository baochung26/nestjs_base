import {
  Repository,
  FindOptionsWhere,
  FindManyOptions,
  DeepPartial,
} from 'typeorm';
import { NotFoundException } from '../../shared/errors/custom-exceptions';

/**
 * Base Repository với common methods
 * Các repositories khác có thể sử dụng các helper methods này
 */
export abstract class BaseRepository<T> {
  protected abstract repository: Repository<T>;

  /**
   * Find entity by ID, throw NotFoundException if not found
   */
  async findById(id: string, options?: FindManyOptions<T>): Promise<T> {
    const entity = await this.repository.findOne({
      where: { id } as any,
      ...options,
    });

    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }

    return entity;
  }

  /**
   * Find entity by ID, return null if not found (no exception)
   */
  async findByIdOrNull(id: string, options?: FindManyOptions<T>): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as any,
      ...options,
    });
  }

  /**
   * Check if entity exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id } as any,
    });
    return count > 0;
  }

  /**
   * Find all active entities (if entity has isActive field)
   */
  async findActive(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find({
      where: { isActive: true } as any,
      ...options,
    });
  }

  /**
   * Find all inactive entities (if entity has isActive field)
   */
  async findInactive(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find({
      where: { isActive: false } as any,
      ...options,
    });
  }

  /**
   * Create entity
   */
  create(entityLike: DeepPartial<T>): T {
    return this.repository.create(entityLike);
  }

  /**
   * Save entity
   */
  async save(entity: T): Promise<T> {
    return this.repository.save(entity);
  }

  /**
   * Remove entity
   */
  async remove(entity: T): Promise<T> {
    return this.repository.remove(entity);
  }

  /**
   * Find all entities
   */
  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }
}
