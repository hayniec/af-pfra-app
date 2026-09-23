export interface Exemptions {
  whtr: boolean;
  cardio: boolean;
  strength: boolean;
  core: boolean;
}

export const DEFAULT_EXEMPTIONS: Exemptions = {
  whtr: false,
  cardio: false,
  strength: false,
  core: false,
};

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
  passed: boolean;
  whtrScore: number;
  cardioScore: number;
  strengthScore: number;
  coreScore: number;
  exemptions?: Exemptions; // backward compat: missing = all false
  assessmentType?: 'official' | 'diagnostic'; // AFMAN 36-2905 Section 3.8
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

