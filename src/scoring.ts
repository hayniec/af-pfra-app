import type { ScoringTable, KeyThresholds } from './types';

export const AGE_GROUPS = [
  '<25', '25-29', '30-34', '35-39', '40-44', '45-49', '50-54', '55-59', '60+',
] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number];

export const TABLE_MAP = {
  whtr: 0,
  crunches: 1,
  pushup: 2,
  handrelease: 3,
  situp: 4,
  plank: 5,
  run: 6,
  hamr: 7,
} as const;

export type EventKey = keyof typeof TABLE_MAP;

export const TIME_BASED_EVENTS: readonly string[] = ['plank', 'run'];

export const PASS_THRESHOLD = 75;

const GOOD_TIER_RATIO = 0.8;

/** Valid input ranges. Time-based values are in seconds. */
export const EVENT_RANGES: Record<string, { min: number; max: number }> = {
  whtr:        { min: 0.30, max: 0.80 },
  run:         { min: 360,  max: 2400 },  // 6:00 – 40:00
  hamr:        { min: 1,    max: 400  },
  pushup:      { min: 0,    max: 200  },
  handrelease: { min: 0,    max: 200  },
  situp:       { min: 0,    max: 200  },
  crunches:    { min: 0,    max: 200  },
  plank:       { min: 1,    max: 3600 },  // up to 60:00
};

/** Default input values. Time-based values are in seconds. */
export const DEFAULT_VALUES: Record<string, number> = {
  whtr:        0.50,
  run:         840,   // 14:00
  hamr:        50,
  pushup:      45,
  handrelease: 35,
  situp:       50,
  crunches:    50,
  plank:       180,   // 3:00
};

export function getColIdx(ageGroup: string, gender: string): number {
  const ageIdx = (AGE_GROUPS as readonly string[]).indexOf(ageGroup);
  return Math.max(0, ageIdx) * 2 + (gender === 'female' ? 1 : 0);
}

export function calculateScore(table: ScoringTable, colIdx: number, value: number): number {
  const sortedRows = [...table.rows].sort((a, b) => b.score - a.score);
  for (const row of sortedRows) {
    const threshold = row.values[colIdx];
    if (table.isLowerBetter ? value <= threshold : value >= threshold) {
      return row.score;
    }
  }
  return 0;
}

export function getKeyThresholds(table: ScoringTable, colIdx: number): KeyThresholds | null {
  const scoringRows = [...table.rows]
    .sort((a, b) => b.score - a.score)
    .filter(r => r.score > 0);

  if (scoringRows.length === 0) return null;

  const maxRow = scoringRows[0];
  const minRow = scoringRows[scoringRows.length - 1];
  const targetScore = maxRow.score * GOOD_TIER_RATIO;
  const goodRow = scoringRows.reduce((prev, curr) =>
    Math.abs(curr.score - targetScore) < Math.abs(prev.score - targetScore) ? curr : prev
  );

  return {
    isLowerBetter: table.isLowerBetter,
    max: { pts: maxRow.score, val: maxRow.values[colIdx] },
    good: { pts: goodRow.score, val: goodRow.values[colIdx] },
    min: { pts: minRow.score, val: minRow.values[colIdx] },
  };
}

export function formatValue(val: number, type: string): string {
  if (TIME_BASED_EVENTS.includes(type)) {
    const mins = Math.floor(val / 60);
    const secs = val % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  if (type === 'whtr') return val.toFixed(2);
  return val.toString();
}

export function validateEvent(type: string, value: number): string | null {
  const range = EVENT_RANGES[type];
  if (!range || value === 0) return null;
  if (value < range.min || value > range.max) {
    if (TIME_BASED_EVENTS.includes(type)) {
      const fmtMin = formatValue(range.min, type);
      const fmtMax = formatValue(range.max, type);
      return `Must be between ${fmtMin} and ${fmtMax}`;
    }
    return `Must be between ${range.min} and ${range.max}`;
  }
  return null;
}
