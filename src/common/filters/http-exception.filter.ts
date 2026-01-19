import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponseDto } from '../dto/api-response.dto';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string;
    let error: string | string[] | object | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
      error = undefined;
    } else {
      const responseObj = exceptionResponse as any;
      message = responseObj.message || exception.message || 'An error occurred';
      error = responseObj.error || responseObj.errors || undefined;
    }

    const errorResponse = new ApiErrorResponseDto(
      status,
      message,
      error,
      request.url,
    );

    response.status(status).json(errorResponse);
  }
}
