import { applyDecorators } from '@nestjs/common';
import { ApiResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import {
  BadRequestErrorResponseDto,
  UnauthorizedErrorResponseDto,
  ForbiddenErrorResponseDto,
  NotFoundErrorResponseDto,
  ConflictErrorResponseDto,
  ValidationErrorResponseDto,
  TooManyRequestsErrorResponseDto,
  InternalServerErrorResponseDto,
} from '../../shared/response/error-response.dto';

/**
 * Common API responses decorators để tránh lặp lại code
 */

export const ApiBadRequestResponse = (
  description: string = 'Bad request — body không hợp lệ',
) => {
  return applyDecorators(
    ApiExtraModels(BadRequestErrorResponseDto),
    ApiResponse({
      status: 400,
      description,
      schema: { $ref: getSchemaPath(BadRequestErrorResponseDto) },
    }),
  );
};

export const ApiUnauthorizedResponse = (
  description: string = 'Unauthorized — invalid or expired token',
) => {
  return applyDecorators(
    ApiExtraModels(UnauthorizedErrorResponseDto),
    ApiResponse({
      status: 401,
      description,
      schema: { $ref: getSchemaPath(UnauthorizedErrorResponseDto) },
    }),
  );
};

export const ApiForbiddenResponse = (
  description: string = 'Forbidden — insufficient permissions',
) => {
  return applyDecorators(
    ApiExtraModels(ForbiddenErrorResponseDto),
    ApiResponse({
      status: 403,
      description,
      schema: { $ref: getSchemaPath(ForbiddenErrorResponseDto) },
    }),
  );
};

export const ApiNotFoundResponse = (
  description: string = 'Not Found — resource not found',
) => {
  return applyDecorators(
    ApiExtraModels(NotFoundErrorResponseDto),
    ApiResponse({
      status: 404,
      description,
      schema: { $ref: getSchemaPath(NotFoundErrorResponseDto) },
    }),
  );
};

export const ApiConflictResponse = (
  description: string = 'Conflict — resource already exists',
) => {
  return applyDecorators(
    ApiExtraModels(ConflictErrorResponseDto),
    ApiResponse({
      status: 409,
      description,
      schema: { $ref: getSchemaPath(ConflictErrorResponseDto) },
    }),
  );
};

export const ApiValidationErrorResponse = (
  description: string = 'Validation Error — request validation failed',
) => {
  return applyDecorators(
    ApiExtraModels(ValidationErrorResponseDto),
    ApiResponse({
      status: 422,
      description,
      schema: { $ref: getSchemaPath(ValidationErrorResponseDto) },
    }),
  );
};

export const ApiTooManyRequestsResponse = (
  description: string = 'Too many requests — vượt giới hạn throttle',
) => {
  return applyDecorators(
    ApiExtraModels(TooManyRequestsErrorResponseDto),
    ApiResponse({
      status: 429,
      description,
      schema: { $ref: getSchemaPath(TooManyRequestsErrorResponseDto) },
    }),
  );
};

export const ApiInternalServerErrorResponse = (
  description: string = 'Internal Server Error',
) => {
  return applyDecorators(
    ApiExtraModels(InternalServerErrorResponseDto),
    ApiResponse({
      status: 500,
      description,
      schema: { $ref: getSchemaPath(InternalServerErrorResponseDto) },
    }),
  );
};

/**
 * Gom các response phổ biến cho auth endpoints
 */
export const ApiAuthCommonResponses = () => {
  return applyDecorators(
    ApiBadRequestResponse(
      'Bad request — body không hợp lệ (ví dụ email sai định dạng, thiếu trường)',
    ),
    ApiUnauthorizedResponse('Invalid credentials — email hoặc mật khẩu sai'),
    ApiTooManyRequestsResponse(
      'Too many requests — vượt giới hạn throttle (10 requests / 10 giây)',
    ),
  );
};

/**
 * Gom các response phổ biến cho protected endpoints (cần JWT)
 */
export const ApiProtectedCommonResponses = () => {
  return applyDecorators(
    ApiUnauthorizedResponse('Unauthorized — invalid or expired token'),
    ApiForbiddenResponse('Forbidden — insufficient permissions'),
  );
};
