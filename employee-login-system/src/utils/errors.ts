/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Common error codes and status codes
 */
export const ErrorCodes = {
  // Auth errors
  INVALID_CREDENTIALS: { code: 'INVALID_CREDENTIALS', status: 401, message: 'Invalid email or password' },
  EMAIL_NOT_VERIFIED: { code: 'EMAIL_NOT_VERIFIED', status: 403, message: 'Please verify your email first' },
  ACCOUNT_LOCKED: { code: 'ACCOUNT_LOCKED', status: 423, message: 'Account is locked due to too many failed login attempts' },
  INVALID_TOKEN: { code: 'INVALID_TOKEN', status: 401, message: 'Invalid or expired token' },
  TOKEN_EXPIRED: { code: 'TOKEN_EXPIRED', status: 401, message: 'Token has expired' },
  MISSING_TOKEN: { code: 'MISSING_TOKEN', status: 401, message: 'Authorization token is missing' },
  INVALID_2FA_CODE: { code: 'INVALID_2FA_CODE', status: 401, message: 'Invalid 2FA code' },
  
  // User errors
  USER_NOT_FOUND: { code: 'USER_NOT_FOUND', status: 404, message: 'User not found' },
  USER_ALREADY_EXISTS: { code: 'USER_ALREADY_EXISTS', status: 409, message: 'User with this email already exists' },
  INSUFFICIENT_PERMISSIONS: { code: 'INSUFFICIENT_PERMISSIONS', status: 403, message: 'You do not have permission to access this resource' },
  
  // Validation errors
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', status: 400, message: 'Validation error' },
  INVALID_EMAIL: { code: 'INVALID_EMAIL', status: 400, message: 'Invalid email address' },
  WEAK_PASSWORD: { code: 'WEAK_PASSWORD', status: 400, message: 'Password does not meet security requirements' },
  
  // Server errors
  INTERNAL_SERVER_ERROR: { code: 'INTERNAL_SERVER_ERROR', status: 500, message: 'Internal server error' },
  DATABASE_ERROR: { code: 'DATABASE_ERROR', status: 500, message: 'Database error' },
  EMAIL_SEND_ERROR: { code: 'EMAIL_SEND_ERROR', status: 500, message: 'Failed to send email' },
} as const;

/**
 * Throw API error with common codes
 */
export function throwError(errorCode: keyof typeof ErrorCodes, details?: Record<string, any>): never {
  const error = ErrorCodes[errorCode];
  throw new ApiError(error.status, error.code, error.message, details);
}
