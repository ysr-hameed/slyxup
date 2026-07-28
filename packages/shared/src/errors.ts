export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ACCOUNT_BLOCKED: 'ACCOUNT_BLOCKED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

export function createErrorResponse(code: ErrorCode, message?: string) {
  return { error: code, message: message || 'An error occurred', code }
}

export function createAuthError(code: ErrorCode, message?: string) {
  return {
    error: code,
    message: message || 'Authentication error',
    code,
    requiresRelogin: code === ERROR_CODES.TOKEN_EXPIRED || code === ERROR_CODES.SESSION_EXPIRED || code === ERROR_CODES.USER_NOT_FOUND,
  }
}
