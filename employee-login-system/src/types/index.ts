// ──────────────────────────────────────────────────────────────────────────────
// User & Authentication Types
// ──────────────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'employee' | 'partner' | 'customer';

export interface IUser {
  id: string;
  email: string;
  password: string; // hashed
  name: string;
  role: UserRole;
  phone?: string;
  profilePicture?: string;
  
  // Security fields
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  
  // Password reset
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  
  // Login tracking
  lastLogin?: Date;
  lastLoginIP?: string;
  lastLoginDevice?: string;
  loginAttempts: number;
  lockedUntil?: Date;
  
  // 2FA
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  
  // Profile data
  department?: string;
  designation?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmployee extends IUser {
  role: 'employee';
  employeeId: string; // Unique employee ID (e.g., EMP001)
  location?: {
    latitude: number;
    longitude: number;
  };
  allowedCheckInRadius: number; // in km
}

export interface IAdmin extends IUser {
  role: 'admin';
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: Omit<IUser, 'password'>;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRole;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
  email: string;
}

export interface Setup2FARequest {
  email: string;
}

export interface Verify2FARequest {
  email: string;
  token: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Work Description Types
// ──────────────────────────────────────────────────────────────────────────────

export interface IWorkDescription {
  id: string;
  employeeId: string;
  title: string;
  description: string;
  taskType: 'installation' | 'maintenance' | 'support' | 'other';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  attachments?: IAttachment[];
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttachment {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

// ──────────────────────────────────────────────────────────────────────────────
// Attendance Types
// ──────────────────────────────────────────────────────────────────────────────

export interface IAttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string; // HH:MM
  checkInLocation?: {
    latitude: number;
    longitude: number;
  };
  checkOutTime?: string;
  checkOutLocation?: {
    latitude: number;
    longitude: number;
  };
  status: 'present' | 'absent' | 'late' | 'leave' | 'half-day';
  workHours: number;
  breakDuration: number; // in minutes
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILoginActivity {
  id: string;
  userId: string;
  loginTime: Date;
  logoutTime?: Date;
  ipAddress: string;
  deviceInfo: string;
  userAgent: string;
  status: 'active' | 'ended';
}

// ──────────────────────────────────────────────────────────────────────────────
// Notification Types
// ──────────────────────────────────────────────────────────────────────────────

export interface INotification {
  id: string;
  userId: string;
  type: 'email' | 'push' | 'in-app';
  subject: string;
  message: string;
  status: 'sent' | 'pending' | 'failed';
  retries: number;
  sentAt?: Date;
  createdAt: Date;
}

// ──────────────────────────────────────────────────────────────────────────────
// API Response Types
// ──────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
