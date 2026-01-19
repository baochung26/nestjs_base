import { applyDecorators, Type } from '@nestjs/common';
import { ApiResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { ApiResponseDto, PaginatedResponseDto } from '../dto/api-response.dto';

/**
 * Decorator để document API response trong Swagger
 * Sử dụng khi có Swagger setup
 */
export const ApiStandardResponse = <TModel extends Type<any>>(
  model: TModel,
  description: string = 'Success',
) => {
  return applyDecorators(
    ApiExtraModels(ApiResponseDto, model),
    ApiResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          {
            properties: {
              data: {
                $ref: getSchemaPath(model),
              },
            },
          },
        ],
      },
    }),
  );
};

export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
  description: string = 'Success',
) => {
  return applyDecorators(
    ApiExtraModels(PaginatedResponseDto, model),
    ApiResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};
