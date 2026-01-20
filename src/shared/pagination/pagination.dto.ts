import { ApiResponseDto } from '../response/api-response.dto';

/**
 * Pagination Metadata
 */
export class PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;

  constructor(page: number, limit: number, total: number) {
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = Math.ceil(total / limit);
  }
}

/**
 * Paginated Response
 */
export class PaginatedResponseDto<T = any> extends ApiResponseDto<T[]> {
  meta: PaginationMetaDto;

  constructor(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = 'Success',
  ) {
    super(true, 200, message, data);
    this.meta = new PaginationMetaDto(page, limit, total);
  }
}

/**
 * Pagination Query DTO
 */
export class PaginationQueryDto {
  page?: number = 1;
  limit?: number = 10;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }

  get take(): number {
    return this.limit;
  }
}
