import { useState, useEffect } from 'react';
import { formatValue, roundWhtr } from '../scoring';
import type { KeyThresholds } from '../types';

interface WhtrInputProps {
  onChange: (ratio: number) => void;
  thresholds?: KeyThresholds | null;
  score?: number;
  heightValue?: number | null;
  heightUnit?: 'in' | 'cm';
  onHeightChange?: (height: number | null, unit: 'in' | 'cm') => void;
  waistValue?: number | null;
  onWaistChange?: (waist: number | null) => void;
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

export function WhtrInput({
  onChange,
  thresholds,
  score,
  heightValue,
  heightUnit = 'in',
  onHeightChange,
  waistValue,
  onWaistChange,
}: WhtrInputProps) {
  const [unit, setUnit] = useState<'in' | 'cm'>(heightUnit);
  const [heightRaw, setHeightRaw] = useState(heightValue ? String(heightValue) : '');
  const [waistRaw, setWaistRaw] = useState(waistValue ? String(waistValue) : '');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (heightUnit !== undefined) {
      setUnit(heightUnit);
    }
  }, [heightUnit]);

  useEffect(() => {
    if (heightValue !== undefined) {
      setHeightRaw(heightValue ? String(heightValue) : '');
    }
  }, [heightValue]);

  useEffect(() => {
    if (waistValue !== undefined) {
      setWaistRaw(waistValue ? String(waistValue) : '');
    }
  }, [waistValue]);

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

  const handleUnitChange = (newUnit: 'in' | 'cm') => {
    setUnit(newUnit);
    if (onHeightChange) {
      onHeightChange(heightNum > 0 ? heightNum : null, newUnit);
    }
  };

  const handleHeightInput = (val: string) => {
    setTouched(true);
    setHeightRaw(val);
    const num = parseFloat(val);
    if (onHeightChange) {
      onHeightChange(!isNaN(num) && num > 0 ? num : null, unit);
    }
  };

  const handleWaistInput = (val: string) => {
    setTouched(true);
    setWaistRaw(val);
    const num = parseFloat(val);
    if (onWaistChange) {
      onWaistChange(!isNaN(num) && num > 0 ? num : null);
    }
  };


  return (
    <div className="form-group">
      <div className="whtr-header">
        <label>Waist-to-Height Ratio (20 PTS)</label>
        <div className="toggle-group" role="group" aria-label="Unit">
          {(['in', 'cm'] as const).map(u => (
            <button
              key={u}
              type="button"
              className={`toggle-btn ${unit === u ? 'active' : ''}`}
              onClick={() => handleUnitChange(u)}
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
            onChange={(e) => handleHeightInput(e.target.value)}
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
            onChange={(e) => handleWaistInput(e.target.value)}
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
          {' '}(scored as {formatValue(roundWhtr(ratio), 'whtr')})
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
