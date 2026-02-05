import { FindManyOptions } from 'typeorm';
import { BaseRepository } from '../repositories/base.repository';

/**
 * Base Service với common CRUD methods.
 * Các services khác có thể extend và override/override methods khi cần.
 * create/update không có trong base vì DTO và logic khác nhau theo từng entity.
 */
export abstract class BaseService<T> {
  constructor(protected readonly repository: BaseRepository<T>) {}

  /**
   * Lấy tất cả entities (có thể truyền options TypeORM).
   * Note: Nếu service cần trả về DTO, có thể override method này với tên khác hoặc implement riêng.
   */
  async findAllEntities(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.findAll(options);
  }

  /**
   * Lấy một entity theo ID, throw NotFoundException nếu không tồn tại.
   * Note: Nếu service cần trả về DTO, có thể override method này với tên khác hoặc implement riêng.
   */
  async findOneEntity(id: string, options?: FindManyOptions<T>): Promise<T> {
    return this.repository.findById(id, options);
  }

  /**
   * Lấy entity theo ID hoặc null (không throw).
   */
  async findOneOrNull(
    id: string,
    options?: FindManyOptions<T>,
  ): Promise<T | null> {
    return this.repository.findByIdOrNull(id, options);
  }

  /**
   * Kiểm tra entity có tồn tại theo ID không.
   */
  async exists(id: string): Promise<boolean> {
    return this.repository.exists(id);
  }

  /**
   * Xóa entity theo ID (throw NotFoundException nếu không tồn tại).
   */
  async remove(id: string): Promise<void> {
    const entity = await this.repository.findById(id);
    await this.repository.remove(entity);
  }
}
