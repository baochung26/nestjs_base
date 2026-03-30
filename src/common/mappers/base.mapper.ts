/**
 * Base Mapper với common methods
 * Các mappers khác có thể extend từ class này
 */
export abstract class BaseMapper<TEntity, TDto> {
  /**
   * Convert entity to DTO
   */
  abstract toDto(entity: TEntity): TDto;

  /**
   * Convert DTO to entity (partial)
   */
  abstract toEntity(dto: Partial<TDto>): Partial<TEntity>;

  /**
   * Convert array of entities to array of DTOs
   */
  toDtoArray(entities: TEntity[]): TDto[] {
    return entities.map((entity) => this.toDto(entity));
  }

  /**
   * Convert array of DTOs to array of entities (partial)
   */
  toEntityArray(dtos: Partial<TDto>[]): Partial<TEntity>[] {
    return dtos.map((dto) => this.toEntity(dto));
  }
}
