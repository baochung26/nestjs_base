/**
 * Success Messages Constants
 */
export const SUCCESS_MESSAGES = {
  // General
  SUCCESS: 'Success',
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  RETRIEVED: 'Retrieved successfully',

  // Auth
  LOGIN_SUCCESS: 'Login successful',
  REGISTER_SUCCESS: 'User registered successfully',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_RESET_SENT: 'Password reset email sent',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',
  EMAIL_VERIFIED: 'Email verified successfully',

  // User
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  USER_ACTIVATED: 'User activated successfully',
  USER_DEACTIVATED: 'User deactivated successfully',

  // File
  FILE_UPLOADED: 'File uploaded successfully',
  FILE_DELETED: 'File deleted successfully',
  FILES_UPLOADED: 'Files uploaded successfully',

  // Queue
  JOB_ADDED: 'Job added successfully',
  QUEUE_CLEANED: 'Queue cleaned successfully',

  // Cache
  CACHE_CLEARED: 'Cache cleared successfully',
} as const;

/**
 * Error Messages Constants
 */
export const ERROR_MESSAGES = {
  // General
  INTERNAL_SERVER_ERROR: 'Internal server error',
  BAD_REQUEST: 'Bad request',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Resource conflict',
  VALIDATION_ERROR: 'Validation failed',
  TOO_MANY_REQUESTS: 'Too many requests, please try again later',

  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  INVALID_TOKEN: 'Invalid or expired token',
  TOKEN_EXPIRED: 'Token has expired',
  ACCOUNT_INACTIVE: 'Account is inactive',
  ACCOUNT_LOCKED: 'Account is locked',

  // User
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists',
  CANNOT_DELETE_SELF: 'Cannot delete your own account',
  CANNOT_DEACTIVATE_SELF: 'Cannot deactivate your own account',

  // File
  FILE_NOT_FOUND: 'File not found',
  FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
  INVALID_FILE_TYPE: 'Invalid file type',
  UPLOAD_FAILED: 'File upload failed',
  DELETE_FAILED: 'File deletion failed',

  // Database
  DATABASE_ERROR: 'Database operation failed',
  CONNECTION_ERROR: 'Database connection error',

  // Queue
  QUEUE_ERROR: 'Queue operation failed',
  JOB_NOT_FOUND: 'Job not found',
  JOB_FAILED: 'Job execution failed',

  // Cache
  CACHE_ERROR: 'Cache operation failed',
} as const;

/**
 * Validation Error Messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: (field: string) => `${field} is required`,
  INVALID_EMAIL: 'Invalid email format',
  MIN_LENGTH: (field: string, min: number) => `${field} must be at least ${min} characters`,
  MAX_LENGTH: (field: string, max: number) => `${field} must not exceed ${max} characters`,
  INVALID_TYPE: (field: string, type: string) => `${field} must be a ${type}`,
  INVALID_ENUM: (field: string, values: string[]) => `${field} must be one of: ${values.join(', ')}`,
  INVALID_FORMAT: (field: string) => `Invalid ${field} format`,
} as const;
