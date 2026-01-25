import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiResponseDto } from '../response/api-response.dto';
import { PAGINATION, HTTP_STATUS, SUCCESS_MESSAGES } from '../../common/constants';

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
    message: string = SUCCESS_MESSAGES.SUCCESS,
  ) {
    super(true, HTTP_STATUS.OK, message, data);
    this.meta = new PaginationMetaDto(page, limit, total);
  }
}

/**
 * Pagination Query DTO
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(PAGINATION.MIN_PAGE)
  page?: number = PAGINATION.DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(PAGINATION.MIN_LIMIT)
  @Max(PAGINATION.MAX_LIMIT)
  limit?: number = PAGINATION.DEFAULT_LIMIT;

  get skip(): number {
    return ((this.page || PAGINATION.DEFAULT_PAGE) - 1) * (this.limit || PAGINATION.DEFAULT_LIMIT);
  }

  get take(): number {
    return this.limit || PAGINATION.DEFAULT_LIMIT;
  }
}

/**
 * Sort Order Enum
 */
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

/**
 * Pagination with Sorting Query DTO
 */
export class PaginationSortQueryDto extends PaginationQueryDto {
  @IsOptional()
  sortBy?: string;

  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;
}
