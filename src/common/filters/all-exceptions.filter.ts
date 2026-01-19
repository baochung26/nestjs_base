import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponseDto } from '../dto/api-response.dto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: string | string[] | object | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message || 'An error occurred';
        error = responseObj.error || responseObj.errors || undefined;
      }
    } else if (exception instanceof Error) {
      message = exception.message || 'Internal server error';
    }

    // Log error for debugging (in production, use proper logging service)
    if (process.env.NODE_ENV === 'development') {
      console.error('Exception caught:', exception);
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
