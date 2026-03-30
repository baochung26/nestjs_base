import { PipeTransform, Injectable } from '@nestjs/common';
import { PAGINATION } from '../constants';

/**
 * PaginationPipe để parse và validate pagination query parameters
 * Transform query params thành PaginationQuery object
 */
@Injectable()
export class PaginationPipe implements PipeTransform {
  transform(value: any) {
    const page = value?.page
      ? parseInt(value.page, 10)
      : PAGINATION.DEFAULT_PAGE;
    const limit = value?.limit
      ? parseInt(value.limit, 10)
      : PAGINATION.DEFAULT_LIMIT;

    // Validate page
    const validPage = page > 0 ? page : PAGINATION.DEFAULT_PAGE;

    // Validate limit (min và max)
    let validLimit = limit;
    if (limit < PAGINATION.MIN_LIMIT) {
      validLimit = PAGINATION.MIN_LIMIT;
    } else if (limit > PAGINATION.MAX_LIMIT) {
      validLimit = PAGINATION.MAX_LIMIT;
    }

    return {
      page: validPage,
      limit: validLimit,
      skip: (validPage - 1) * validLimit,
    };
  }
}
