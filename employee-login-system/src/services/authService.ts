import { hashPassword, comparePassword, generateRandomToken } from '../utils/cryptoUtil';
import { generateAccessToken, generateRefreshToken } from '../utils/jwtUtil';
import { sendVerificationEmail, sendPasswordResetEmail, sendLoginNotificationEmail } from '../utils/emailService';
import { throwError } from '../utils/errors';
import { IUser, IEmployee, AuthResponse, UserRole, IAdmin } from '../types/index';

/**
 * Mock database for demonstration
 * In production, this would be MongoDB
 */
const usersDatabase: Map<string, IUser> = new Map();
const refreshTokens: Map<string, string> = new Map(); // token -> userId mapping
const passwordResetTokens: Map<string, { userId: string; expiry: Date }> = new Map();
const emailVerificationTokens: Map<string, { userId: string; expiry: Date }> = new Map();

// Seed some demo users for testing
function seedDemoUsers() {
  const demoUsers: IUser[] = [
    {
      id: '1',
      email: 'admin@swayog.com',
      password: '$2a$10$YourHashedPasswordHere', // In production, this would be bcrypt hashed
      name: 'Admin User',
      role: 'admin',
      emailVerified: true,
      loginAttempts: 0,
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      email: 'employee@swayog.com',
      password: '$2a$10$YourHashedPasswordHere',
      name: 'Solar Technician',
      role: 'employee',
      emailVerified: true,
      loginAttempts: 0,
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  demoUsers.forEach(user => {
    usersDatabase.set(user.email, user);
  });
}

// Initialize on module load
if (usersDatabase.size === 0) {
  seedDemoUsers();
}

export class AuthService {
  /**
   * Register new user
   */
  async register(
    email: string,
    password: string,
    name: string,
    role: UserRole = 'employee',
    phone?: string
  ): Promise<{ user: IUser; emailSent: boolean }> {
    // Check if user already exists
    if (usersDatabase.has(email)) {
      throwError('USER_ALREADY_EXISTS');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate email verification token
    const emailVerificationToken = generateRandomToken();
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user
    const newUser: IUser = {
      id: String(Date.now()),
      email,
      password: hashedPassword,
      name,
      role,
      phone,
      emailVerified: false,
      emailVerificationToken,
      emailVerificationExpiry,
      loginAttempts: 0,
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    usersDatabase.set(email, newUser);
    emailVerificationTokens.set(emailVerificationToken, {
      userId: newUser.id,
      expiry: emailVerificationExpiry,
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(email, name, emailVerificationToken);

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return { user: userWithoutPassword as IUser, emailSent };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string, email: string): Promise<IUser> {
    const user = usersDatabase.get(email);
    if (!user) {
      throwError('USER_NOT_FOUND');
    }

    const tokenData = emailVerificationTokens.get(token);
    if (!tokenData || tokenData.userId !== user.id || tokenData.expiry < new Date()) {
      throwError('INVALID_TOKEN', { reason: 'Email verification token expired or invalid' });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    user.updatedAt = new Date();

    usersDatabase.set(email, user);
    emailVerificationTokens.delete(token);

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as IUser;
  }

  /**
   * Login user
   */
  async login(
    email: string,
    password: string,
    deviceInfo?: string,
    ipAddress?: string
  ): Promise<AuthResponse> {
    const user = usersDatabase.get(email);

    // User not found
    if (!user) {
      throwError('INVALID_CREDENTIALS');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throwError('ACCOUNT_LOCKED');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throwError('EMAIL_NOT_VERIFIED', {
        message: 'Please verify your email before logging in',
      });
    }

    // Verify password
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
      }

      usersDatabase.set(email, user);
      throwError('INVALID_CREDENTIALS');
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lastLogin = new Date();
    if (ipAddress) user.lastLoginIP = ipAddress;
    if (deviceInfo) user.lastLoginDevice = deviceInfo;
    user.updatedAt = new Date();

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token
    refreshTokens.set(refreshToken, user.id);

    // Save updated user
    usersDatabase.set(email, user);

    // Send login notification email (async, don't wait)
    if (ipAddress || deviceInfo) {
      sendLoginNotificationEmail(email, user.name, deviceInfo || 'Unknown Device', ipAddress || 'Unknown IP');
    }

    const { password: _, ...userWithoutPassword } = user;
    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword as IUser,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
    const userId = refreshTokens.get(refreshToken);
    if (!userId) {
      throwError('INVALID_TOKEN', { reason: 'Refresh token not found or invalid' });
    }

    // Find user by ID
    let user: IUser | undefined;
    for (const u of usersDatabase.values()) {
      if (u.id === userId) {
        user = u;
        break;
      }
    }

    if (!user) {
      throwError('USER_NOT_FOUND');
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { password: _, ...userWithoutPassword } = user;
    return {
      accessToken: newAccessToken,
      user: userWithoutPassword as IUser,
      expiresIn: 15 * 60,
    };
  }

  /**
   * Forgot password - send reset email
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const user = usersDatabase.get(email);
    if (!user) {
      // Don't reveal if user exists or not for security reasons
      return { success: true, message: 'If the email exists, a password reset link has been sent' };
    }

    // Generate password reset token
    const resetToken = generateRandomToken();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    passwordResetTokens.set(resetToken, {
      userId: user.id,
      expiry: resetExpiry,
    });

    // Send reset email
    const emailSent = await sendPasswordResetEmail(email, user.name, resetToken);

    return {
      success: emailSent,
      message: emailSent
        ? 'Password reset link has been sent to your email'
        : 'Failed to send password reset email',
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<IUser> {
    const tokenData = passwordResetTokens.get(token);
    if (!tokenData || tokenData.expiry < new Date()) {
      throwError('INVALID_TOKEN', { reason: 'Password reset token expired or invalid' });
    }

    // Find user by ID
    let user: IUser | undefined;
    for (const u of usersDatabase.values()) {
      if (u.id === tokenData.userId) {
        user = u;
        break;
      }
    }

    if (!user) {
      throwError('USER_NOT_FOUND');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.loginAttempts = 0;
    user.lockedUntil = undefined;
    user.updatedAt = new Date();

    // Save updated user
    usersDatabase.set(user.email, user);
    passwordResetTokens.delete(token);

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as IUser;
  }

  /**
   * Logout user (invalidate refresh token)
   */
  async logout(refreshToken: string): Promise<boolean> {
    refreshTokens.delete(refreshToken);
    return true;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<IUser | null> {
    const user = usersDatabase.get(email);
    if (!user) return null;

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as IUser;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUser | null> {
    for (const user of usersDatabase.values()) {
      if (user.id === userId) {
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword as IUser;
      }
    }
    return null;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<IUser>): Promise<IUser> {
    let user: IUser | undefined;
    let userEmail: string | undefined;

    for (const [email, u] of usersDatabase.entries()) {
      if (u.id === userId) {
        user = u;
        userEmail = email;
        break;
      }
    }

    if (!user || !userEmail) {
      throwError('USER_NOT_FOUND');
    }

    // Update allowed fields only
    const allowedUpdates = ['name', 'phone', 'department', 'designation', 'profilePicture'];
    for (const key of allowedUpdates) {
      if (key in updates) {
        (user as any)[key] = (updates as any)[key];
      }
    }

    user.updatedAt = new Date();
    usersDatabase.set(userEmail, user);

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as IUser;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<IUser> {
    let user: IUser | undefined;
    let userEmail: string | undefined;

    for (const [email, u] of usersDatabase.entries()) {
      if (u.id === userId) {
        user = u;
        userEmail = email;
        break;
      }
    }

    if (!user || !userEmail) {
      throwError('USER_NOT_FOUND');
    }

    // Verify current password
    const passwordMatch = await comparePassword(currentPassword, user.password);
    if (!passwordMatch) {
      throwError('INVALID_CREDENTIALS', { reason: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    user.updatedAt = new Date();

    usersDatabase.set(userEmail, user);

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as IUser;
  }
}