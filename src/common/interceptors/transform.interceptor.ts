import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../../shared/response/api-response.dto';
import { SUCCESS_MESSAGES } from '../constants';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponseDto<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponseDto<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        // Nếu data đã là ApiResponseDto, return nguyên vẹn
        if (data instanceof ApiResponseDto) {
          return data;
        }

        // Nếu data có message, sử dụng message đó
        const message = data?.message || SUCCESS_MESSAGES.SUCCESS;

        // Nếu data có message, loại bỏ nó khỏi data
        const cleanData = data?.message
          ? { ...data, message: undefined }
          : data;

        return new ApiResponseDto<T>(
          true,
          statusCode,
          message,
          cleanData,
          request.url,
        );
      }),
    );
  }
}
