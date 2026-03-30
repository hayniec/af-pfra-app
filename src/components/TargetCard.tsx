import type { KeyThresholds } from '../types';
import { formatValue } from '../scoring';

interface TargetCardProps {
  thresholds: KeyThresholds;
  label: string;
  maxPts: number;
  valueType: string;
}

export function TargetCard({ thresholds, label, maxPts, valueType }: TargetCardProps) {
  const sym = thresholds.isLowerBetter ? '≤' : '≥';
  return (
    <div className="target-card">
      <div className="target-card-header">
        <h4>{label}</h4>
        <span className="target-max-pts">{maxPts} PTS</span>
      </div>
      <div className="range-box">
        <div className="range-item tier-max">
          <span className="range-label">Max</span>
          <span className="range-val highlight-max">{sym} {formatValue(thresholds.max.val, valueType)}</span>
          <span className="range-pts">{thresholds.max.pts} pts</span>
        </div>
        <div className="range-item tier-good">
          <span className="range-label">Good</span>
          <span className="range-val highlight-good">{sym} {formatValue(thresholds.good.val, valueType)}</span>
          <span className="range-pts">{thresholds.good.pts} pts</span>
        </div>
        <div className="range-item tier-min">
          <span className="range-label">Pass</span>
          <span className="range-val highlight-min">{sym} {formatValue(thresholds.min.val, valueType)}</span>
          <span className="range-pts">{thresholds.min.pts} pts</span>
        </div>
      </div>
    </div>
  );
}
