/**
 * Standard API Response Format
 */
export class ApiResponseDto<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  timestamp: string;
  path?: string;

  constructor(
    success: boolean,
    statusCode: number,
    message: string,
    data?: T,
    path?: string,
  ) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
    this.path = path;
  }
}

/**
 * Standard API Error Response Format
 */
export class ApiErrorResponseDto {
  success: boolean;
  statusCode: number;
  message: string;
  error?: string | string[] | object;
  timestamp: string;
  path: string;

  constructor(
    statusCode: number,
    message: string,
    error?: string | string[] | object,
    path?: string,
  ) {
    this.success = false;
    this.statusCode = statusCode;
    this.message = message;
    this.error = error;
    this.timestamp = new Date().toISOString();
    this.path = path || '';
  }
}
