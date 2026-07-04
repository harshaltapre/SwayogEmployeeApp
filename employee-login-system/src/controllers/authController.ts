import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { ApiError } from '../utils/errors';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../utils/validation';

const authService = new AuthService();

export class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);

      const { user, emailSent } = await authService.register(
        data.email,
        data.password,
        data.name,
        data.role,
        data.phone
      );

      res.status(201).json({
        success: true,
        data: {
          user,
          message: emailSent
            ? 'Registration successful. Please check your email to verify your account.'
            : 'Registration successful, but email verification could not be sent.',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email
   * POST /api/auth/verify-email
   */
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const data = verifyEmailSchema.parse(req.body);
      const user = await authService.verifyEmail(data.token, data.email);

      res.json({
        success: true,
        data: {
          user,
          message: 'Email verified successfully. You can now log in.',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);

      const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
      const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown IP';

      const authResponse = await authService.login(
        data.email,
        data.password,
        deviceInfo,
        ipAddress
      );

      // Set refresh token in httpOnly cookie (more secure than localStorage)
      res.cookie('refreshToken', authResponse.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: authResponse,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh-token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      // Get refresh token from cookie or body
      const refreshToken =
        req.cookies?.refreshToken ||
        (req.body.refreshToken as string);

      if (!refreshToken) {
        throw new ApiError(
          401,
          'MISSING_TOKEN',
          'Refresh token is required'
        );
      }

      const data = refreshTokenSchema.parse({ refreshToken });
      const authResponse = await authService.refreshAccessToken(data.refreshToken);

      res.json({
        success: true,
        data: authResponse,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken =
        req.cookies?.refreshToken ||
        (req.body.refreshToken as string) ||
        '';

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        data: { message: 'Logged out successfully' },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot password - send reset email
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      const result = await authService.forgotPassword(data.email);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const data = resetPasswordSchema.parse(req.body);
      const user = await authService.resetPassword(data.token, data.password);

      res.json({
        success: true,
        data: {
          user,
          message: 'Password reset successfully. You can now log in with your new password.',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(
          401,
          'MISSING_TOKEN',
          'User not authenticated'
        );
      }

      const user = await authService.getUserById(req.user.userId);
      if (!user) {
        throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
      }

      res.json({
        success: true,
        data: { user },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(
          401,
          'MISSING_TOKEN',
          'User not authenticated'
        );
      }

      const user = await authService.updateUserProfile(req.user.userId, req.body);

      res.json({
        success: true,
        data: { user },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(
          401,
          'MISSING_TOKEN',
          'User not authenticated'
        );
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new ApiError(
          400,
          'VALIDATION_ERROR',
          'Current password and new password are required'
        );
      }

      const user = await authService.changePassword(
        req.user.userId,
        currentPassword,
        newPassword
      );

      res.json({
        success: true,
        data: {
          user,
          message: 'Password changed successfully',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}