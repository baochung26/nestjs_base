import { ApiResponseDto } from './api-response.dto';
import { PaginatedResponseDto } from '../pagination/pagination.dto';

/**
 * Helper functions để tạo response chuẩn
 */
export class ResponseHelper {
  /**
   * Tạo success response
   */
  static success<T>(
    data: T,
    message: string = 'Success',
    statusCode: number = 200,
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
    message: string = 'Success',
  ): PaginatedResponseDto<T> {
    return new PaginatedResponseDto(data, page, limit, total, message);
  }

  /**
   * Tạo response với message tùy chỉnh
   */
  static created<T>(
    data: T,
    message: string = 'Created successfully',
    path?: string,
  ): ApiResponseDto<T> {
    return new ApiResponseDto(true, 201, message, data, path);
  }

  /**
   * Tạo response cho update
   */
  static updated<T>(
    data: T,
    message: string = 'Updated successfully',
    path?: string,
  ): ApiResponseDto<T> {
    return new ApiResponseDto(true, 200, message, data, path);
  }

  /**
   * Tạo response cho delete
   */
  static deleted(
    message: string = 'Deleted successfully',
    path?: string,
  ): ApiResponseDto<null> {
    return new ApiResponseDto(true, 200, message, null, path);
  }
}
