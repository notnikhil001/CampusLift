import { z } from 'zod';
import { GroupStatus, TripStatus } from '@prisma/client';

export const joinGroupSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  intentId: z.string().optional(),
});

export const createGroupSchema = z.object({
  intentId: z.string().min(1, 'Intent ID is required'),
});

export const updateCommonTimeSchema = z.object({
  commonTime: z.string().min(1, 'Common time is required'),
});

export const setMeetingPointSchema = z.object({
  meetingPointId: z.string().min(1, 'Meeting point location ID is required'),
});

export const updateGroupStatusSchema = z.object({
  status: z.nativeEnum(GroupStatus),
});

export const rateTripSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  ratedUserId: z.string().min(1, 'Rated user ID is required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  tags: z.array(z.string()).default([]),
  comment: z.string().max(500, 'Comment cannot exceed 500 characters').optional(),
});
