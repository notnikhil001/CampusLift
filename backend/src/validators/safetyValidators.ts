import { z } from 'zod';
import { ReportStatus, Status, LocationType } from '@prisma/client';

export const reportSchema = z.object({
  reportedUserId: z.string().optional(),
  groupId: z.string().optional(),
  category: z.enum([
    'Harassment',
    'Fake profile',
    'Suspicious behavior',
    'Inappropriate content',
    'Spam',
    'Other',
  ]),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

export const blockUserSchema = z.object({
  blockedUserId: z.string().min(1, 'Target user ID is required'),
});

export const collegeSchema = z.object({
  name: z.string().min(2, 'College name must be at least 2 characters'),
  emailDomain: z.string().min(3, 'Domain must be e.g. college.edu or iitb.ac.in'),
  logo: z.string().url('Invalid logo URL').or(z.literal('')).optional(),
  status: z.nativeEnum(Status).optional(),
});

export const locationSchema = z.object({
  collegeId: z.string().min(1, 'College ID is required'),
  name: z.string().min(2, 'Location name is required'),
  description: z.string().optional(),
  type: z.nativeEnum(LocationType).default(LocationType.POPULAR),
  active: z.boolean().default(true),
});

export const resolveReportSchema = z.object({
  status: z.enum(['INVESTIGATING', 'RESOLVED', 'REJECTED']),
  adminNotes: z.string().optional(),
});
