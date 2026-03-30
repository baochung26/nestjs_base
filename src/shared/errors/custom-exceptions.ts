import { HttpException } from '@nestjs/common';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../common/constants';

export class BadRequestException extends HttpException {
  constructor(
    message: string | string[] = ERROR_MESSAGES.BAD_REQUEST,
    error?: string,
  ) {
    super(
      {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message,
        error: error || ERROR_MESSAGES.BAD_REQUEST,
      },
      HTTP_STATUS.BAD_REQUEST,
    );
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = ERROR_MESSAGES.UNAUTHORIZED, error?: string) {
    super(
      {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        message,
        error: error || ERROR_MESSAGES.UNAUTHORIZED,
      },
      HTTP_STATUS.UNAUTHORIZED,
    );
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string = ERROR_MESSAGES.FORBIDDEN, error?: string) {
    super(
      {
        statusCode: HTTP_STATUS.FORBIDDEN,
        message,
        error: error || ERROR_MESSAGES.FORBIDDEN,
      },
      HTTP_STATUS.FORBIDDEN,
    );
  }
}

export class NotFoundException extends HttpException {
  constructor(message: string = ERROR_MESSAGES.NOT_FOUND, error?: string) {
    super(
      {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message,
        error: error || ERROR_MESSAGES.NOT_FOUND,
      },
      HTTP_STATUS.NOT_FOUND,
    );
  }
}

export class ConflictException extends HttpException {
  constructor(message: string = ERROR_MESSAGES.CONFLICT, error?: string) {
    super(
      {
        statusCode: HTTP_STATUS.CONFLICT,
        message,
        error: error || ERROR_MESSAGES.CONFLICT,
      },
      HTTP_STATUS.CONFLICT,
    );
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(
    message: string = ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    error?: string,
  ) {
    super(
      {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message,
        error: error || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      },
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
}

export class ValidationException extends HttpException {
  constructor(
    message: string | string[] = ERROR_MESSAGES.VALIDATION_ERROR,
    error?: string,
  ) {
    super(
      {
        statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
        message,
        error: error || ERROR_MESSAGES.VALIDATION_ERROR,
      },
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
    );
  }
}
