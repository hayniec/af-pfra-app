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
