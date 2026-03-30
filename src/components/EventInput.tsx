import { useState } from 'react';
import { TIME_BASED_EVENTS, validateEvent, formatValue } from '../scoring';
import type { KeyThresholds } from '../types';

export interface EventOption {
  value: string;
  label: string;
}

interface EventInputProps {
  sectionLabel: string;
  maxPts: number;
  options?: EventOption[];
  selectedType: string;
  onTypeChange?: (type: string) => void;
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  thresholds?: KeyThresholds | null;
  valueType?: string;
  score?: number;
}

function TimeInput({
  value,
  onChange,
  onTouch,
}: {
  value: number;
  onChange: (v: number) => void;
  onTouch: () => void;
}) {
  const mins = Math.floor(value / 60);
  const secs = value % 60;

  return (
    <div className="time-input-group">
      <input
        type="number"
        min={0}
        value={mins}
        onChange={(e) => {
          onTouch();
          onChange(Math.max(0, Number(e.target.value) || 0) * 60 + secs);
        }}
        aria-label="Minutes"
        placeholder="MM"
      />
      <span className="time-sep" aria-hidden="true">:</span>
      <input
        type="number"
        min={0}
        max={59}
        value={secs}
        onChange={(e) => {
          onTouch();
          onChange(mins * 60 + Math.min(59, Math.max(0, Number(e.target.value) || 0)));
        }}
        aria-label="Seconds"
        placeholder="SS"
      />
    </div>
  );
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

export function EventInput({
  sectionLabel,
  maxPts,
  options,
  selectedType,
  onTypeChange,
  value,
  onChange,
  placeholder,
  thresholds,
  valueType,
  score,
}: EventInputProps) {
  const [touched, setTouched] = useState(false);
  const [rawInput, setRawInput] = useState(() => value > 0 ? String(value) : '');
  const timeBased = TIME_BASED_EVENTS.includes(selectedType);
  const error = touched ? validateEvent(selectedType, value) : null;
  const labelId = `label-${sectionLabel.toLowerCase().replace(/\W+/g, '-')}`;

  return (
    <div className="form-group">
      <label id={labelId}>
        {sectionLabel} ({maxPts} PTS)
      </label>

      {options && options.length > 1 && (
        <div className="toggle-group toggle-group-mb" role="group" aria-labelledby={labelId}>
          {options.map((opt) => (
            <button
              key={opt.value}
              className={`toggle-btn ${selectedType === opt.value ? 'active' : ''}`}
              onClick={() => onTypeChange?.(opt.value)}
              aria-pressed={selectedType === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {timeBased ? (
        <TimeInput value={value} onChange={onChange} onTouch={() => setTouched(true)} />
      ) : (
        <input
          type="number"
          placeholder={placeholder ?? 'Enter value'}
          value={rawInput}
          onChange={(e) => {
            setTouched(true);
            setRawInput(e.target.value);
            const num = Number(e.target.value);
            onChange(isNaN(num) ? 0 : num);
          }}
          onBlur={() => setTouched(true)}
          aria-label={placeholder}
          aria-invalid={!!error}
          step={selectedType === 'whtr' ? '0.01' : '1'}
        />
      )}

      {error && (
        <p className="input-error" role="alert">
          {error}
        </p>
      )}

      {thresholds && valueType && (
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
                {thresholds.isLowerBetter ? '≤' : '≥'} {formatValue(data.val, valueType)}
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
