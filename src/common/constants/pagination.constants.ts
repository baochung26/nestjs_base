/**
 * Pagination Constants
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MIN_PAGE: 1,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
} as const;

export const PAGINATION_MESSAGES = {
  INVALID_PAGE: `Page must be at least ${PAGINATION.MIN_PAGE}`,
  INVALID_LIMIT: `Limit must be between ${PAGINATION.MIN_LIMIT} and ${PAGINATION.MAX_LIMIT}`,
} as const;
