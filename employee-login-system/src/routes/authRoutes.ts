import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { loginLimiter, passwordResetLimiter } from '../middleware/validation';

const router = Router();
const controller = new AuthController();

/**
 * Public routes (no authentication required)
 */

// Register new user
router.post('/register', (req, res, next) => controller.register(req, res, next));

// Verify email
router.post('/verify-email', (req, res, next) => controller.verifyEmail(req, res, next));

// Login - with rate limiting
router.post('/login', loginLimiter, (req, res, next) => controller.login(req, res, next));

// Refresh token
router.post('/refresh-token', (req, res, next) => controller.refreshToken(req, res, next));

// Forgot password - with rate limiting
router.post('/forgot-password', passwordResetLimiter, (req, res, next) =>
  controller.forgotPassword(req, res, next)
);

// Reset password
router.post('/reset-password', (req, res, next) => controller.resetPassword(req, res, next));

/**
 * Protected routes (authentication required)
 */

// Get current user profile
router.get('/me', authMiddleware, (req, res, next) => controller.getCurrentUser(req, res, next));

// Update profile
router.put('/profile', authMiddleware, (req, res, next) => controller.updateProfile(req, res, next));

// Change password
router.post('/change-password', authMiddleware, (req, res, next) =>
  controller.changePassword(req, res, next)
);

// Logout
router.post('/logout', authMiddleware, (req, res, next) => controller.logout(req, res, next));

export { router as authRoutes };