import { describe, it, expect } from 'vitest';
import rawScoringData from './scoringData.json';
import type { ScoringTable } from './types';
import {
  AGE_GROUPS,
  TABLE_MAP,
  getColIdx,
  calculateScore,
  getKeyThresholds,
  parseTimeInput,
  formatValue,
  validateEvent,
} from './scoring';

const scoringData = rawScoringData as ScoringTable[];
const getTable = (id: number) => scoringData.find(t => t.id === id)!;

// ---- getColIdx ----

describe('getColIdx', () => {
  it('returns 0 for male under-25', () => {
    expect(getColIdx('<25', 'male')).toBe(0);
  });

  it('returns 1 for female under-25', () => {
    expect(getColIdx('<25', 'female')).toBe(1);
  });

  it('returns correct index for 30-34 male (age group index 2)', () => {
    expect(getColIdx('30-34', 'male')).toBe(4);
  });

  it('returns correct index for 30-34 female', () => {
    expect(getColIdx('30-34', 'female')).toBe(5);
  });

  it('returns correct index for last age group 60+ female', () => {
    const lastIdx = AGE_GROUPS.length - 1; // 8
    expect(getColIdx('60+', 'female')).toBe(lastIdx * 2 + 1);
  });

  it('clamps to 0 for unknown age group', () => {
    expect(getColIdx('unknown', 'male')).toBe(0);
  });
});

// ---- parseTimeInput ----

describe('parseTimeInput', () => {
  it('converts 13.25 to 805 seconds', () => {
    expect(parseTimeInput(13.25)).toBe(805);
  });

  it('converts 14.00 to 840 seconds', () => {
    expect(parseTimeInput(14.00)).toBe(840);
  });

  it('converts 9.30 to 570 seconds', () => {
    expect(parseTimeInput(9.30)).toBe(570);
  });

  it('converts 0.00 to 0 seconds', () => {
    expect(parseTimeInput(0)).toBe(0);
  });

  it('converts 1.01 to 61 seconds', () => {
    expect(parseTimeInput(1.01)).toBe(61);
  });
});

// ---- formatValue ----

describe('formatValue', () => {
  it('formats seconds as MM:SS for run', () => {
    expect(formatValue(805, 'run')).toBe('13:25');
  });

  it('formats seconds as MM:SS for plank', () => {
    expect(formatValue(185, 'plank')).toBe('3:05');
  });

  it('pads single-digit seconds with leading zero', () => {
    expect(formatValue(840, 'run')).toBe('14:00');
  });

  it('formats WHtR to 2 decimal places', () => {
    expect(formatValue(0.5, 'whtr')).toBe('0.50');
  });

  it('formats rep-based events as plain string', () => {
    expect(formatValue(42, 'pushup')).toBe('42');
  });
});

// ---- calculateScore (WHtR — isLowerBetter) ----

describe('calculateScore — WHtR (lower is better)', () => {
  const table = getTable(TABLE_MAP.whtr);
  const colIdx = getColIdx('<25', 'male'); // 0

  it('returns 20 pts for WHtR of 0.49 (max threshold)', () => {
    expect(calculateScore(table, colIdx, 0.49)).toBe(20);
  });

  it('returns 19 pts for WHtR of 0.50', () => {
    expect(calculateScore(table, colIdx, 0.50)).toBe(19);
  });

  it('returns 0 pts for WHtR above the worst threshold', () => {
    expect(calculateScore(table, colIdx, 0.99)).toBe(0);
  });

  it('returns 20 pts for WHtR well below max threshold', () => {
    expect(calculateScore(table, colIdx, 0.30)).toBe(20);
  });
});

// ---- calculateScore (Push-ups — higher is better) ----

describe('calculateScore — push-ups (higher is better)', () => {
  const table = getTable(TABLE_MAP.pushup);
  const colIdxMale = getColIdx('<25', 'male');
  const colIdxFemale = getColIdx('<25', 'female');

  it('returns 0 pts for 0 reps', () => {
    expect(calculateScore(table, colIdxMale, 0)).toBe(0);
  });

  it('scores differ between male and female for same rep count', () => {
    const maleScore = calculateScore(table, colIdxMale, 20);
    const femaleScore = calculateScore(table, colIdxFemale, 20);
    // Female thresholds are lower so same reps should yield >= male score
    expect(femaleScore).toBeGreaterThanOrEqual(maleScore);
  });
});

// ---- getKeyThresholds ----

describe('getKeyThresholds', () => {
  const table = getTable(TABLE_MAP.whtr);
  const colIdx = getColIdx('<25', 'male');

  it('returns non-null result for valid table', () => {
    expect(getKeyThresholds(table, colIdx)).not.toBeNull();
  });

  it('max.pts >= good.pts >= min.pts', () => {
    const t = getKeyThresholds(table, colIdx)!;
    expect(t.max.pts).toBeGreaterThanOrEqual(t.good.pts);
    expect(t.good.pts).toBeGreaterThanOrEqual(t.min.pts);
  });

  it('isLowerBetter is true for WHtR', () => {
    expect(getKeyThresholds(table, colIdx)!.isLowerBetter).toBe(true);
  });

  it('isLowerBetter is false for push-ups', () => {
    const pushupTable = getTable(TABLE_MAP.pushup);
    expect(getKeyThresholds(pushupTable, colIdx)!.isLowerBetter).toBe(false);
  });

  it('max.val <= min.val for lower-is-better events', () => {
    const t = getKeyThresholds(table, colIdx)!;
    expect(t.max.val).toBeLessThanOrEqual(t.min.val);
  });

  it('max.val >= min.val for higher-is-better events', () => {
    const pushupTable = getTable(TABLE_MAP.pushup);
    const t = getKeyThresholds(pushupTable, colIdx)!;
    expect(t.max.val).toBeGreaterThanOrEqual(t.min.val);
  });
});

// ---- validateEvent ----

describe('validateEvent', () => {
  it('returns null for valid WHtR', () => {
    expect(validateEvent('whtr', 0.50)).toBeNull();
  });

  it('returns error for WHtR too high', () => {
    expect(validateEvent('whtr', 0.99)).not.toBeNull();
  });

  it('returns error for WHtR too low', () => {
    expect(validateEvent('whtr', 0.10)).not.toBeNull();
  });

  it('returns null when value is 0 (not yet entered)', () => {
    expect(validateEvent('pushup', 0)).toBeNull();
  });

  it('returns null for valid rep count', () => {
    expect(validateEvent('pushup', 50)).toBeNull();
  });

  it('returns error for rep count over max', () => {
    expect(validateEvent('pushup', 500)).not.toBeNull();
  });

  it('includes formatted times in error message for time-based events', () => {
    const err = validateEvent('run', 100);
    expect(err).toContain(':');
  });
});
