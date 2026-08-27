import { describe, it, expect } from 'vitest';
import { createGroupSchema, joinGroupSchema } from '../src/validators/groupValidators';

describe('CampusLift Group Flow & Idempotency Validators', () => {
  it('validates explicit group creation payload requiring intentId', () => {
    const valid = createGroupSchema.safeParse({ intentId: '123e4567-e89b-12d3-a456-426614174000' });
    expect(valid.success).toBe(true);

    const invalid = createGroupSchema.safeParse({ intentId: '' });
    expect(invalid.success).toBe(false);
  });

  it('validates join group payload requiring groupId with optional intentId', () => {
    const validWithIntent = joinGroupSchema.safeParse({
      groupId: '123e4567-e89b-12d3-a456-426614174000',
      intentId: '123e4567-e89b-12d3-a456-426614174001',
    });
    expect(validWithIntent.success).toBe(true);

    const validWithoutIntent = joinGroupSchema.safeParse({
      groupId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(validWithoutIntent.success).toBe(true);

    const invalid = joinGroupSchema.safeParse({ groupId: '' });
    expect(invalid.success).toBe(false);
  });
});
