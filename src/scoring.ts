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

/** Converts MM.SS decimal input to total seconds (e.g. 13.25 → 805s) */
export function parseTimeInput(val: number): number {
  return Math.floor(val) * 60 + Math.round((val % 1) * 100);
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
