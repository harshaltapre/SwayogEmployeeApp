import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';

export async function sendAdminEmailIfConfigured(to: string[], subject: string, text: string, imageFilePath?: string | null) {
  // Only attempt to send email if SMTP config exists
  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS) {
    // SMTP not configured
    return false;
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT),
      secure: env.SMTP_SECURE === 'true',
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });

    const attachments: any[] = [];
    if (imageFilePath && fs.existsSync(imageFilePath)) {
      attachments.push({ filename: path.basename(imageFilePath), path: imageFilePath });
    }

    const info = await transporter.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to: to.join(','),
      subject,
      text,
      attachments,
    });

    console.log('Admin notification email sent:', info.messageId);
    return true;
  } catch (err) {
    console.error('Failed sending admin email:', err);
    return false;
  }
}
