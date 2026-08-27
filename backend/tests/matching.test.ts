import { describe, it, expect } from 'vitest';
import {
  computeEffectiveTimeWindow,
  calculateTimeOverlapMinutes,
  evaluateMatchQuality,
} from '../src/utils/matching';
import { TimeMode } from '@prisma/client';

describe('CampusLift Matching Engine', () => {
  it('correctly calculates effective window for TIME RANGE mode', () => {
    const window = computeEffectiveTimeWindow('2026-08-11', TimeMode.RANGE, '08:00', '08:30');
    
    expect(window.effectiveStart.toISOString()).toContain('08:00');
    expect(window.effectiveEnd.toISOString()).toContain('08:30');
  });

  it('correctly calculates effective window for FLEXIBLE mode (+/- 15 mins)', () => {
    const window = computeEffectiveTimeWindow(
      '2026-08-11',
      TimeMode.FLEXIBLE,
      undefined,
      undefined,
      '08:15',
      15
    );

    expect(window.effectiveStart.toISOString()).toContain('08:00');
    expect(window.effectiveEnd.toISOString()).toContain('08:30');
  });

  it('calculates overlap duration between two overlapping time windows', () => {
    const startA = new Date('2026-08-11T08:00:00Z');
    const endA = new Date('2026-08-11T08:30:00Z');

    const startB = new Date('2026-08-11T08:10:00Z');
    const endB = new Date('2026-08-11T08:40:00Z');

    const overlap = calculateTimeOverlapMinutes(startA, endA, startB, endB);
    expect(overlap).toBe(20);
  });

  it('returns 0 overlap for non-overlapping windows', () => {
    const startA = new Date('2026-08-11T08:00:00Z');
    const endA = new Date('2026-08-11T08:30:00Z');

    const startB = new Date('2026-08-11T09:00:00Z');
    const endB = new Date('2026-08-11T09:30:00Z');

    const overlap = calculateTimeOverlapMinutes(startA, endA, startB, endB);
    expect(overlap).toBe(0);
  });

  it('assigns Strong Match label when overlap is 20+ minutes', () => {
    const startA = new Date('2026-08-11T08:00:00Z');
    const endA = new Date('2026-08-11T08:30:00Z');

    const startB = new Date('2026-08-11T08:05:00Z');
    const endB = new Date('2026-08-11T08:35:00Z');

    const result = evaluateMatchQuality(startA, endA, startB, endB, 'Campus', 'Railway Station');
    expect(result).not.toBeNull();
    expect(result?.label).toBe('Strong Match');
    expect(result?.reasons).toContain('✓ Same pickup point: Campus');
  });
});
