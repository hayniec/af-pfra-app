import { useState } from 'react';
import { TIME_BASED_EVENTS, validateEvent } from '../scoring';

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

export function EventInput({
  sectionLabel,
  maxPts,
  options,
  selectedType,
  onTypeChange,
  value,
  onChange,
  placeholder,
}: EventInputProps) {
  const [touched, setTouched] = useState(false);
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
          value={value || ''}
          onChange={(e) => {
            setTouched(true);
            onChange(Number(e.target.value));
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
    </div>
  );
}
