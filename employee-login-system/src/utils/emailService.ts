import nodemailer from 'nodemailer';
import { INotification } from '../types/index';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@swayog.com';

/**
 * Send verification email with token/OTP
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const verificationLink = `${FRONTEND_URL}/verify-email?token=${token}&email=${email}`;
  
  try {
    await transporter.sendMail({
      from: `Swayog Energy <${ADMIN_EMAIL}>`,
      to: email,
      subject: 'Verify Your Email - Swayog Energy',
      html: `
        <h2>Welcome to Swayog Energy, ${name}!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationLink}" style="
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 24px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
        ">Verify Email</a>
        <p>Or copy this link: ${verificationLink}</p>
        <p>This link expires in 24 hours.</p>
        <hr />
        <p><small>If you didn't create this account, please ignore this email.</small></p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;
  
  try {
    await transporter.sendMail({
      from: `Swayog Energy <${ADMIN_EMAIL}>`,
      to: email,
      subject: 'Reset Your Password - Swayog Energy',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the link below to proceed:</p>
        <a href="${resetLink}" style="
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 24px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
        ">Reset Password</a>
        <p>Or copy this link: ${resetLink}</p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

/**
 * Send 2FA setup email with QR code
 */
export async function send2FASetupEmail(
  email: string,
  name: string,
  qrCodeDataUrl: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `Swayog Energy <${ADMIN_EMAIL}>`,
      to: email,
      subject: 'Set Up Two-Factor Authentication - Swayog Energy',
      html: `
        <h2>Enable Two-Factor Authentication</h2>
        <p>Hi ${name},</p>
        <p>You're setting up two-factor authentication for your Swayog Energy account.</p>
        <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc):</p>
        <img src="${qrCodeDataUrl}" alt="2FA QR Code" style="margin: 20px 0; width: 200px; height: 200px;" />
        <p>After scanning, enter the 6-digit code from your authenticator app to complete setup.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send 2FA setup email:', error);
    return false;
  }
}

/**
 * Send login notification email
 */
export async function sendLoginNotificationEmail(
  email: string,
  name: string,
  deviceInfo: string,
  ipAddress: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `Swayog Energy <${ADMIN_EMAIL}>`,
      to: email,
      subject: 'New Login to Your Account - Swayog Energy',
      html: `
        <h2>New Login Detected</h2>
        <p>Hi ${name},</p>
        <p>Your account was just accessed from a new device:</p>
        <ul>
          <li><strong>Device:</strong> ${deviceInfo}</li>
          <li><strong>IP Address:</strong> ${ipAddress}</li>
          <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>If this wasn't you, please change your password immediately.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send login notification email:', error);
    return false;
  }
}

/**
 * Send work description notification to admin
 */
export async function sendWorkDescriptionNotification(
  employeeName: string,
  taskType: string,
  description: string,
  submittedAt: Date
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `Swayog Energy <${ADMIN_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `New Work Description from ${employeeName}`,
      html: `
        <h2>New Work Description Submitted</h2>
        <p><strong>Employee:</strong> ${employeeName}</p>
        <p><strong>Task Type:</strong> ${taskType}</p>
        <p><strong>Submitted at:</strong> ${submittedAt.toLocaleString()}</p>
        <hr />
        <h3>Description:</h3>
        <p>${description}</p>
        <hr />
        <p><a href="${FRONTEND_URL}/admin/work-logs">View in Admin Dashboard</a></p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send work description notification:', error);
    return false;
  }
}

/**
 * Test SMTP connection
 */
export async function testSMTPConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✓ SMTP connection verified');
    return true;
  } catch (error) {
    console.error('✗ SMTP connection failed:', error);
    return false;
  }
}
