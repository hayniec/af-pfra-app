import { useState, useEffect } from 'react';
import { formatValue } from '../scoring';
import type { KeyThresholds } from '../types';

interface WhtrInputProps {
  onChange: (ratio: number) => void;
  thresholds?: KeyThresholds | null;
  score?: number;
}

function scoreColorClass(score: number, thresholds: KeyThresholds): string {
  if (score <= 0) return 'score-none';
  if (score >= thresholds.max.pts)  return 'highlight-max';
  if (score >= thresholds.good.pts) return 'highlight-good';
  if (score >= thresholds.min.pts)  return 'highlight-min';
  return 'score-fail';
}

function scoreTierClass(score: number, thresholds: KeyThresholds): string {
  if (score <= 0) return 'tier-none';
  if (score >= thresholds.max.pts)  return 'tier-max';
  if (score >= thresholds.good.pts) return 'tier-good';
  if (score >= thresholds.min.pts)  return 'tier-min';
  return 'tier-fail';
}

export function WhtrInput({ onChange, thresholds, score }: WhtrInputProps) {
  const [unit, setUnit] = useState<'in' | 'cm'>('in');
  const [heightRaw, setHeightRaw] = useState('');
  const [waistRaw, setWaistRaw] = useState('');
  const [touched, setTouched] = useState(false);

  const heightNum = parseFloat(heightRaw) || 0;
  const waistNum  = parseFloat(waistRaw)  || 0;
  const ratio     = heightNum > 0 && waistNum > 0 ? waistNum / heightNum : 0;
  const hasValues = heightNum > 0 && waistNum > 0;
  const error     = touched && hasValues && ratio >= 1.0
    ? 'Waist must be less than height'
    : null;

  useEffect(() => {
    onChange(error ? 0 : ratio);
  }, [ratio, error]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="form-group">
      <div className="whtr-header">
        <label>Waist-to-Height Ratio (20 PTS)</label>
        <div className="toggle-group" role="group" aria-label="Unit">
          {(['in', 'cm'] as const).map(u => (
            <button
              key={u}
              className={`toggle-btn ${unit === u ? 'active' : ''}`}
              onClick={() => setUnit(u)}
              aria-pressed={unit === u}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="input-row">
        <div className="form-group">
          <label htmlFor="whtr-height">Height ({unit})</label>
          <input
            id="whtr-height"
            type="number"
            min={0}
            step={unit === 'in' ? '0.5' : '1'}
            placeholder={unit === 'in' ? 'e.g. 70' : 'e.g. 178'}
            value={heightRaw}
            onChange={(e) => { setTouched(true); setHeightRaw(e.target.value); }}
            onBlur={() => setTouched(true)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="whtr-waist">Waist ({unit})</label>
          <input
            id="whtr-waist"
            type="number"
            min={0}
            step={unit === 'in' ? '0.5' : '1'}
            placeholder={unit === 'in' ? 'e.g. 34' : 'e.g. 86'}
            value={waistRaw}
            onChange={(e) => { setTouched(true); setWaistRaw(e.target.value); }}
            onBlur={() => setTouched(true)}
          />
        </div>
      </div>

      {error && (
        <p className="input-error" role="alert">{error}</p>
      )}

      {hasValues && !error && (
        <p className="whtr-ratio-display">
          Ratio: <span className="whtr-ratio-value">{ratio.toFixed(3)}</span>
        </p>
      )}

      {thresholds && (
        <div className="threshold-hint">
          {(
            [
              { key: 'max',  label: 'Max',  cls: 'tier-max',  color: 'highlight-max',  data: thresholds.max  },
              { key: 'good', label: 'Good', cls: 'tier-good', color: 'highlight-good', data: thresholds.good },
              { key: 'min',  label: 'Pass', cls: 'tier-min',  color: 'highlight-min',  data: thresholds.min  },
            ] as const
          ).map(({ key, label, cls, color, data }) => (
            <div key={key} className={`threshold-item ${cls}`}>
              <span className="threshold-label">{label}</span>
              <span className={`threshold-val ${color}`}>
                ≤ {formatValue(data.val, 'whtr')}
              </span>
              <span className="threshold-pts">{data.pts} pts</span>
            </div>
          ))}

          {score !== undefined && (
            <div className={`threshold-item threshold-item-you ${scoreTierClass(score, thresholds)}`}>
              <span className="threshold-label">You</span>
              <span className={`threshold-val ${scoreColorClass(score, thresholds)}`}>
                {score > 0 ? `${score} pts` : '—'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
