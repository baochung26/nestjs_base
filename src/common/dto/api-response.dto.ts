/**
 * Standard API Response Format
 */
export class ApiResponseDto<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  timestamp: string;
  path?: string;

  constructor(
    success: boolean,
    statusCode: number,
    message: string,
    data?: T,
    path?: string,
  ) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
    this.path = path;
  }
}

/**
 * Standard API Error Response Format
 */
export class ApiErrorResponseDto {
  success: boolean;
  statusCode: number;
  message: string;
  error?: string | string[] | object;
  timestamp: string;
  path: string;

  constructor(
    statusCode: number,
    message: string,
    error?: string | string[] | object,
    path?: string,
  ) {
    this.success = false;
    this.statusCode = statusCode;
    this.message = message;
    this.error = error;
    this.timestamp = new Date().toISOString();
    this.path = path || '';
  }
}

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
