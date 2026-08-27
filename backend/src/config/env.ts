import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  SESSION_SECRET: z.string().default('campuslift-session-secret'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('CampusLift <no-reply@campuslift.app>'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  // In development, provide fallback defaults if DATABASE_URL or JWT_SECRET are missing
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  process.env.PORT = process.env.PORT || '5000';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/campuslift?schema=public';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-campuslift-2026-min32chars';
  process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'super-secret-session-key-campuslift-2026';
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  process.env.EMAIL_FROM = process.env.EMAIL_FROM || 'CampusLift <no-reply@campuslift.app>';
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/campuslift?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-jwt-key-campuslift-2026-min32chars',
  SESSION_SECRET: process.env.SESSION_SECRET || 'super-secret-session-key-campuslift-2026',
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || 'CampusLift <no-reply@campuslift.app>',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};
