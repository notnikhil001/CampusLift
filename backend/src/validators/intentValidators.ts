import { z } from 'zod';
import { TimeMode } from '@prisma/client';

export const createIntentSchema = z
  .object({
    fromLocationId: z.string().min(1, 'Origin location is required'),
    toLocationId: z.string().min(1, 'Destination location is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    timeMode: z.nativeEnum(TimeMode),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be HH:MM').optional(),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be HH:MM').optional(),
    preferredTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Preferred time must be HH:MM').optional(),
    flexibilityMinutes: z.number().min(5).max(120).optional(),
    note: z.string().max(300, 'Note cannot exceed 300 characters').optional(),
  })
  .refine((data) => data.fromLocationId !== data.toLocationId, {
    message: 'Pickup location and destination cannot be the same',
    path: ['toLocationId'],
  })
  .refine(
    (data) => {
      const today = new Date().toISOString().split('T')[0];
      return data.date >= today;
    },
    {
      message: 'Travel date cannot be in the past',
      path: ['date'],
    }
  )
  .refine(
    (data) => {
      if (data.timeMode === TimeMode.RANGE) {
        return !!(data.startTime && data.endTime && data.startTime < data.endTime);
      }
      return true;
    },
    {
      message: 'Time Range requires valid start and end times where start time is earlier than end time',
      path: ['endTime'],
    }
  )
  .refine(
    (data) => {
      if (data.timeMode === TimeMode.FLEXIBLE) {
        return !!(data.preferredTime && data.flexibilityMinutes);
      }
      return true;
    },
    {
      message: 'Flexible mode requires preferred time and flexibility minutes',
      path: ['preferredTime'],
    }
  );
