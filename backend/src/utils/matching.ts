import { TimeMode } from '@prisma/client';

export interface EffectiveTimeWindow {
  effectiveStart: Date;
  effectiveEnd: Date;
}

export function computeEffectiveTimeWindow(
  dateStr: string,
  timeMode: TimeMode,
  startTime?: string | null,
  endTime?: string | null,
  preferredTime?: string | null,
  flexibilityMinutes?: number | null
): EffectiveTimeWindow {
  const [year, month, day] = dateStr.split('-').map(Number);

  if (timeMode === TimeMode.RANGE && startTime && endTime) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const start = new Date(Date.UTC(year, month - 1, day, startH, startM, 0));
    const end = new Date(Date.UTC(year, month - 1, day, endH, endM, 0));

    return { effectiveStart: start, effectiveEnd: end };
  } else if (timeMode === TimeMode.FLEXIBLE && preferredTime) {
    const [prefH, prefM] = preferredTime.split(':').map(Number);
    const flex = flexibilityMinutes || 15;

    const center = new Date(Date.UTC(year, month - 1, day, prefH, prefM, 0));
    const start = new Date(center.getTime() - flex * 60 * 1000);
    const end = new Date(center.getTime() + flex * 60 * 1000);

    return { effectiveStart: start, effectiveEnd: end };
  }

  // Fallback to full day if missing
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
  return { effectiveStart: start, effectiveEnd: end };
}

export function calculateTimeOverlapMinutes(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): number {
  const latestStart = startA.getTime() > startB.getTime() ? startA.getTime() : startB.getTime();
  const earliestEnd = endA.getTime() < endB.getTime() ? endA.getTime() : endB.getTime();

  if (latestStart > earliestEnd) {
    return 0; // No overlap
  }

  return Math.round((earliestEnd - latestStart) / (60 * 1000));
}

export interface MatchScoreResult {
  score: number;
  label: 'Strong Match' | 'Good Match' | 'Possible Match';
  reasons: string[];
  overlapMinutes: number;
}

export function evaluateMatchQuality(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
  fromName?: string,
  toName?: string
): MatchScoreResult | null {
  const overlapMinutes = calculateTimeOverlapMinutes(startA, endA, startB, endB);

  if (overlapMinutes <= 0) {
    return null; // Not compatible
  }

  const reasons: string[] = [];
  if (fromName) reasons.push(`✓ Same pickup point: ${fromName}`);
  if (toName) reasons.push(`✓ Same destination: ${toName}`);
  reasons.push('✓ Same travel date');
  reasons.push(`✓ ${overlapMinutes}-minute time window overlap`);

  let label: 'Strong Match' | 'Good Match' | 'Possible Match' = 'Possible Match';
  let score = 50 + Math.min(overlapMinutes, 30);

  if (overlapMinutes >= 20) {
    label = 'Strong Match';
    score += 20;
  } else if (overlapMinutes >= 10) {
    label = 'Good Match';
    score += 10;
  }

  return {
    score: Math.min(score, 100),
    label,
    reasons,
    overlapMinutes,
  };
}
