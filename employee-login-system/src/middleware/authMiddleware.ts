import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwtUtil';
import { ApiError, throwError } from '../utils/errors';
import { AuthTokenPayload, UserRole } from '../types/index';

// Extend Express Request to include user information
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
      token?: string;
    }
  }
}

/**
 * JWT Authentication middleware
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.accessToken;

    if (!token) {
      throwError('MISSING_TOKEN');
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      throwError('INVALID_TOKEN');
    }

    // Attach user info to request
    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        timestamp: new Date().toISOString(),
      });
    }
    
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Role-based access control middleware
 */
export function roleMiddleware(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization token is missing',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to access this resource',
          details: { requiredRoles: allowedRoles, userRole: req.user.role },
        },
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

/**
 * Verify user owns the data being accessed
 */
export function ownershipMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Authorization token is missing',
      },
      timestamp: new Date().toISOString(),
    });
  }

  const userId = req.params.userId || req.params.id;
  if (userId && req.user.userId !== userId && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to access this resource',
      },
      timestamp: new Date().toISOString(),
    });
  }

  next();
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.accessToken;

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        req.user = decoded;
        req.token = token;
      }
    }
  } catch (error) {
    // Silently fail - this is optional auth
  }

  next();
}

/**
 * Legacy middleware for backward compatibility
 */
export const authenticate = (req: any, res: any, next: any) => {
  authMiddleware(req, res, next);
};

export const authorizeAdmin = (req: any, res: any, next: any) => {
  roleMiddleware('admin')(req, res, next);
};