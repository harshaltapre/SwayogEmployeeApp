import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '../types/index';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default-access-secret-change-in-production';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production';

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: '15m',
  });
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: '7d',
  });
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET) as AuthTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as AuthTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Decode token without verification (use with caution)
 */
export function decodeToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.decode(token) as AuthTokenPayload | null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Get token expiry in seconds
 */
export function getTokenExpiryInSeconds(token: string): number | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;
  
  const expiryTime = decoded.exp * 1000; // Convert to ms
  const currentTime = Date.now();
  const secondsRemaining = (expiryTime - currentTime) / 1000;
  
  return Math.max(0, secondsRemaining);
}

/**
 * Check if token is expiring soon (within 5 minutes)
 */
export function isTokenExpiringSoon(token: string, thresholdSeconds: number = 300): boolean {
  const secondsRemaining = getTokenExpiryInSeconds(token);
  return secondsRemaining !== null && secondsRemaining < thresholdSeconds;
}
