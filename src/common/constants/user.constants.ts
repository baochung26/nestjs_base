/**
 * User-related Constants
 */
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const USER_STATUS = {
  ACTIVE: true,
  INACTIVE: false,
} as const;

export const USER_DEFAULTS = {
  ROLE: USER_ROLES.USER,
  IS_ACTIVE: USER_STATUS.ACTIVE,
  MIN_PASSWORD_LENGTH: 6,
} as const;
