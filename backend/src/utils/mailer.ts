import nodemailer from 'nodemailer';
import { env } from '../config/env';

const transporter =
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      })
    : null;

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  if (!transporter) {
    console.log(`\n📧 [DEV EMAIL FALLBACK] Email to: ${email}`);
    console.log(`🔗 Verification URL: ${verifyUrl}\n`);
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Verify your CampusLift Account',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Welcome to CampusLift!</h2>
          <p>Please click the button below to verify your college email address:</p>
          <a href="${verifyUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
            Verify College Email
          </a>
          <p style="font-size: 12px; color: #666;">Or copy and paste this link: ${verifyUrl}</p>
          <p style="font-size: 12px; color: #666; margin-top: 8px;">Your Verification Token: <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${token}</code></p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send email via Nodemailer:', error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  if (!transporter) {
    console.log(`\n📧 [DEV EMAIL FALLBACK] Password Reset to: ${email}`);
    console.log(`🔗 Reset URL: ${resetUrl}\n`);
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Reset your CampusLift Password',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">CampusLift Password Reset</h2>
          <p>Click the link below to reset your password (valid for 1 hour):</p>
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
            Reset Password
          </a>
          <p style="font-size: 12px; color: #666;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to send reset email via Nodemailer:', error);
    return { success: false, error };
  }
}
