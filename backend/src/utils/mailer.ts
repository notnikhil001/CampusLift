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

// Helper to check if a Resend API key is real and valid (not placeholder dummy like re_123456789)
function isRealResendKey(key?: string): boolean {
  if (!key) return false;
  if (key === 're_123456789' || key.startsWith('re_12345') || key.length < 15) return false;
  return true;
}

export async function sendVerificationEmail(email: string, token: string, otp?: string) {
  const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
  const otpCode = otp || token.split('_')[0] || token.substring(0, 6);

  // Log to backend console for developer visibility in all modes
  console.log(`\n📧 [EMAIL DISPATCH] Verification email generated for: ${email}`);
  console.log(`🔢 6-Digit OTP Code: ${otpCode}`);
  console.log(`🔗 Direct Verification Link: ${verifyUrl}\n`);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 800;">CampusLift</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Student Travel Coordination Platform</p>
      </div>
      
      <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello,</p>
      <p style="font-size: 15px; line-height: 1.5; color: #334155;">Enter the 6-digit OTP code below on CampusLift or click the direct verification button to verify your college email address:</p>

      <!-- 6-Digit OTP Box -->
      <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 1px; display: block; margin-bottom: 6px;">Your Verification OTP</span>
        <div style="font-size: 36px; font-weight: 800; color: #4f46e5; letter-spacing: 8px;">${otpCode}</div>
      </div>

      <!-- Direct Link Button -->
      <div style="text-align: center; margin: 24px 0;">
        <a href="${verifyUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
          Verify College Email Directly
        </a>
      </div>

      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">This OTP code and link will expire in 24 hours.</p>
    </div>
  `;

  // 1. Try Resend HTTP API if real key is configured
  if (isRealResendKey(env.RESEND_API_KEY)) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          from: env.EMAIL_FROM || 'onboarding@resend.dev',
          to: [email],
          subject: `${otpCode} is your CampusLift Verification Code`,
          html: htmlContent,
        }),
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        console.log(`✅ [Resend] Verification email dispatched to ${email}`);
        return { success: true };
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.warn(`⚠️ [Resend API Error] Status ${res.status}:`, errorData);
      }
    } catch (err: any) {
      console.warn(`⚠️ [Resend Dispatch Warning] ${err.name === 'AbortError' ? 'Timeout' : err.message}`);
    }
  }

  // 2. Try Nodemailer if SMTP is configured
  if (transporter) {
    try {
      const sendPromise = transporter.sendMail({
        from: env.EMAIL_FROM,
        to: email,
        subject: `${otpCode} is your CampusLift Verification Code`,
        html: htmlContent,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP timeout')), 3000)
      );

      await Promise.race([sendPromise, timeoutPromise]);
      console.log(`✅ [SMTP] Verification email dispatched to ${email}`);
      return { success: true };
    } catch (err: any) {
      console.warn(`⚠️ [SMTP Dispatch Warning]:`, err.message);
    }
  }

  console.log(`ℹ️ [Email Dispatch Fallback] Proceeding with simulated email delivery.`);
  return { success: true, simulated: true };
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  console.log(`\n📧 [EMAIL DISPATCH] Password Reset email generated for: ${email}`);
  console.log(`🔗 Reset Link: ${resetUrl}\n`);

  if (isRealResendKey(env.RESEND_API_KEY)) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          from: env.EMAIL_FROM || 'onboarding@resend.dev',
          to: [email],
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
        }),
      });

      clearTimeout(timeoutId);
      if (res.ok) return { success: true };
    } catch (err: any) {
      console.warn(`⚠️ [Resend Reset Email Error]:`, err.message);
    }
  }

  if (transporter) {
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
          </div>
        `,
      });
      return { success: true };
    } catch (err: any) {
      console.warn(`⚠️ [SMTP Reset Email Error]:`, err.message);
    }
  }

  return { success: true, simulated: true };
}
