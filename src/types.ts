export interface HistoryEntry {
  id: string;
  savedAt: string; // ISO date string
  ageGroup: string;
  gender: string;
  cardioType: string;
  cardioValue: number;
  strengthType: string;
  strengthValue: number;
  coreType: string;
  coreValue: number;
  whtrValue: number;
  compositeScore: number;
  /** Points available for this assessment — below 100 when a component was exempt
   *  or unscored. Absent on entries saved before proration existed. */
  availablePoints?: number;
  whtrExempt?: boolean;
  passed: boolean;
  whtrScore: number;
  cardioScore: number;
  strengthScore: number;
  coreScore: number;
}

export interface ScoringRow {
  score: number;
  values: number[];
}

export interface ScoringTable {
  id: number;
  maxScore: number;
  isLowerBetter: boolean;
  rows: ScoringRow[];
}

export interface Threshold {
  pts: number;
  val: number;
}

export interface KeyThresholds {
  isLowerBetter: boolean;
  max: Threshold;
  good: Threshold;
  min: Threshold;
}

export interface LastAssessmentValues {
  waist?: number;
  cardioType?: string;
  cardioValue?: number;
  strengthType?: string;
  strengthValue?: number;
  coreType?: string;
  coreValue?: number;
}

export interface UserProfile {
  gender: string;
  ageGroup: string;
  height: number | null;
  heightUnit: 'in' | 'cm';
  rememberLastValues: boolean;
  lastValues?: LastAssessmentValues;
}

