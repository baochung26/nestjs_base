import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

/**
 * Common API responses decorators để tránh lặp lại code
 */

export const ApiBadRequestResponse = (description: string = 'Bad request — body không hợp lệ') => {
  return ApiResponse({ status: 400, description });
};

export const ApiUnauthorizedResponse = (description: string = 'Unauthorized — invalid or expired token') => {
  return ApiResponse({ status: 401, description });
};

export const ApiConflictResponse = (description: string = 'Conflict — resource already exists') => {
  return ApiResponse({ status: 409, description });
};

export const ApiTooManyRequestsResponse = (description: string = 'Too many requests — vượt giới hạn throttle') => {
  return ApiResponse({ status: 429, description });
};

/**
 * Gom các response phổ biến cho auth endpoints
 */
export const ApiAuthCommonResponses = () => {
  return applyDecorators(
    ApiBadRequestResponse('Bad request — body không hợp lệ (ví dụ email sai định dạng, thiếu trường)'),
    ApiUnauthorizedResponse('Invalid credentials — email hoặc mật khẩu sai'),
    ApiTooManyRequestsResponse('Too many requests — vượt giới hạn throttle (10 requests / 10 giây)'),
  );
};

/**
 * Gom các response phổ biến cho protected endpoints (cần JWT)
 */
export const ApiProtectedCommonResponses = () => {
  return applyDecorators(
    ApiUnauthorizedResponse('Unauthorized — invalid or expired token'),
  );
};
