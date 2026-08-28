import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  collegeId: z.string().min(1, 'Please select your college'),
  phoneNumber: z.string().optional(),
  course: z.string().optional(),
  year: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z
  .object({
    token: z.string().optional(),
    otp: z.string().optional(),
  })
  .refine((data) => data.token || data.otp, {
    message: 'Either direct verification token or 6-digit OTP code is required',
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phoneNumber: z.string().optional(),
  profilePhoto: z.string().url('Invalid photo URL').or(z.literal('')).optional(),
  course: z.string().optional(),
  year: z.string().optional(),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
});

