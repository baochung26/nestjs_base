import { HttpException, HttpStatus } from '@nestjs/common';

export class BadRequestException extends HttpException {
  constructor(message: string | string[], error?: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: error || 'Bad Request',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Unauthorized', error?: string) {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        message,
        error: error || 'Unauthorized',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string = 'Forbidden', error?: string) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message,
        error: error || 'Forbidden',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string = 'Not Found', error?: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message,
        error: error || 'Not Found',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ConflictException extends HttpException {
  constructor(message: string = 'Conflict', error?: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message,
        error: error || 'Conflict',
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(message: string = 'Internal Server Error', error?: string) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message,
        error: error || 'Internal Server Error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class ValidationException extends HttpException {
  constructor(message: string | string[], error?: string) {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message,
        error: error || 'Validation Error',
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
