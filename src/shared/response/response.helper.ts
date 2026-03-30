import { ApiResponseDto } from './api-response.dto';
import { PaginatedResponseDto } from '../pagination/pagination.dto';
import { SUCCESS_MESSAGES, HTTP_STATUS } from '../../common/constants';

/**
 * Helper functions để tạo response chuẩn
 */
export class ResponseHelper {
  /**
   * Tạo success response
   */
  static success<T>(
    data: T,
    message: string = SUCCESS_MESSAGES.SUCCESS,
    statusCode: number = HTTP_STATUS.OK,
    path?: string,
  ): ApiResponseDto<T> {
    return new ApiResponseDto(true, statusCode, message, data, path);
  }

  /**
   * Tạo paginated response
   */
  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message: string = SUCCESS_MESSAGES.SUCCESS,
  ): PaginatedResponseDto<T> {
    return new PaginatedResponseDto(data, page, limit, total, message);
  }

  /**
   * Tạo response với message tùy chỉnh
   */
  static created<T>(
    data: T,
    message: string = SUCCESS_MESSAGES.CREATED,
    path?: string,
  ): ApiResponseDto<T> {
    return new ApiResponseDto(true, HTTP_STATUS.CREATED, message, data, path);
  }

  /**
   * Tạo response cho update
   */
  static updated<T>(
    data: T,
    message: string = SUCCESS_MESSAGES.UPDATED,
    path?: string,
  ): ApiResponseDto<T> {
    return new ApiResponseDto(true, HTTP_STATUS.OK, message, data, path);
  }

  /**
   * Tạo response cho delete
   */
  static deleted(
    message: string = SUCCESS_MESSAGES.DELETED,
    path?: string,
  ): ApiResponseDto<null> {
    return new ApiResponseDto(true, HTTP_STATUS.OK, message, null, path);
  }
}
