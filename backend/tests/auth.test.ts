import { describe, it, expect } from 'vitest';
import { registerSchema, createIntentSchema } from '../src/validators/index.js';

describe('CampusLift Zod Input Validation', () => {
  it('rejects registration with invalid email syntax', () => {
    const result = registerSchema.safeParse({
      name: 'Test Student',
      email: 'not-an-email',
      password: 'Password123!',
      collegeId: 'college-123',
    });

    expect(result.success).toBe(false);
  });

  it('rejects intent creation where Pickup location equals Destination location', () => {
    const today = new Date().toISOString().split('T')[0];
    const result = createIntentSchema.safeParse({
      fromLocationId: 'loc-1',
      toLocationId: 'loc-1',
      date: today,
      timeMode: 'RANGE',
      startTime: '08:00',
      endTime: '08:30',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('cannot be the same');
    }
  });

  it('accepts valid TIME RANGE intent', () => {
    const today = new Date().toISOString().split('T')[0];
    const result = createIntentSchema.safeParse({
      fromLocationId: 'loc-1',
      toLocationId: 'loc-2',
      date: today,
      timeMode: 'RANGE',
      startTime: '08:00',
      endTime: '08:30',
      note: 'Heading to station',
    });

    expect(result.success).toBe(true);
  });
});
