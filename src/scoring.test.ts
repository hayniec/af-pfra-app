import { describe, it, expect } from 'vitest';
import rawScoringData from './scoringData.json';
import type { ScoringTable } from './types';
import {
  AGE_GROUPS,
  TABLE_MAP,
  getColIdx,
  calculateScore,
  getKeyThresholds,
  formatValue,
  validateEvent,
  getWalkBracket,
  getWalkThreshold,
  getHamrLevel,
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

// ---- getWalkBracket ----

describe('getWalkBracket', () => {
  it('maps <25 and 25-29 to <30', () => {
    expect(getWalkBracket('<25')).toBe('<30');
    expect(getWalkBracket('25-29')).toBe('<30');
  });

  it('maps 30-34 and 35-39 to 30-39', () => {
    expect(getWalkBracket('30-34')).toBe('30-39');
    expect(getWalkBracket('35-39')).toBe('30-39');
  });

  it('maps 40-44 and 45-49 to 40-49', () => {
    expect(getWalkBracket('40-44')).toBe('40-49');
    expect(getWalkBracket('45-49')).toBe('40-49');
  });

  it('maps 50-54 and 55-59 to 50-59', () => {
    expect(getWalkBracket('50-54')).toBe('50-59');
    expect(getWalkBracket('55-59')).toBe('50-59');
  });

  it('maps 60+ to 60+', () => {
    expect(getWalkBracket('60+')).toBe('60+');
  });
});

// ---- getWalkThreshold ----

describe('getWalkThreshold', () => {
  it('returns male threshold for <25 male', () => {
    expect(getWalkThreshold('<25', 'male')).toBe(976);
  });

  it('returns female threshold for <25 female', () => {
    expect(getWalkThreshold('<25', 'female')).toBe(1042);
  });

  it('female threshold is always higher than male for same bracket', () => {
    const brackets = ['<25', '30-34', '40-44', '50-54', '60+'];
    for (const ag of brackets) {
      expect(getWalkThreshold(ag, 'female')).toBeGreaterThan(getWalkThreshold(ag, 'male'));
    }
  });

  it('returns higher threshold for older age groups (male)', () => {
    expect(getWalkThreshold('60+', 'male')).toBeGreaterThan(getWalkThreshold('<25', 'male'));
  });
});

// ---- getHamrLevel ----

describe('getHamrLevel', () => {
  it('returns null for 0 shuttles', () => {
    expect(getHamrLevel(0)).toBeNull();
  });

  it('returns level 1, shuttle 1 for 1 shuttle', () => {
    const result = getHamrLevel(1);
    expect(result).not.toBeNull();
    expect(result!.level).toBe(1);
    expect(result!.shuttle).toBe(1);
  });

  it('returns level 1, last shuttle for 7 shuttles', () => {
    const result = getHamrLevel(7)!;
    expect(result.level).toBe(1);
    expect(result.shuttle).toBe(7);
    expect(result.totalInLevel).toBe(7);
  });

  it('returns level 2 for 8 shuttles', () => {
    expect(getHamrLevel(8)!.level).toBe(2);
  });

  it('returns level 6, shuttle 1 for 42 shuttles', () => {
    const result = getHamrLevel(42)!;
    expect(result.level).toBe(6);
    expect(result.shuttle).toBe(1);
  });

  it('returns level 15 for 155 shuttles', () => {
    expect(getHamrLevel(155)!.level).toBe(15);
  });

  it('returns level 16 for shuttles beyond level 15', () => {
    expect(getHamrLevel(200)!.level).toBe(16);
  });
});
