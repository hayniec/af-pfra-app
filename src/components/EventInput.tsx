import { useState, useEffect } from 'react';
import {
  TIME_BASED_EVENTS,
  validateEvent,
  formatValue,
  HAMR_LEVELS,
  getHamrShuttles,
  getMaxShuttlesInLevel,
  getHamrLevel,
} from '../scoring';
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
  walkPassFail?: { threshold: number; passed: boolean | null } | null;
  hamrLevel?: { level: number; shuttle: number; totalInLevel: number } | null;
  paceInfo?: { perMile: string } | null;
  exempt?: boolean;
  onToggleExempt?: () => void;
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
  const [minsRaw, setMinsRaw] = useState(() => value > 0 ? String(Math.floor(value / 60)) : '');
  const [secsRaw, setSecsRaw] = useState(() => value > 0 ? String(value % 60).padStart(2, '0') : '');

  const update = (m: string, s: string) => {
    const mNum = parseInt(m) || 0;
    const sNum = parseInt(s) || 0;
    onChange(mNum * 60 + sNum);
  };

  return (
    <div className="time-input-group">
      <input
        type="number"
        min={0}
        value={minsRaw}
        onChange={(e) => {
          onTouch();
          setMinsRaw(e.target.value);
          update(e.target.value, secsRaw);
        }}
        aria-label="Minutes"
        placeholder="MM"
      />
      <span className="time-sep" aria-hidden="true">:</span>
      <input
        type="number"
        min={0}
        max={59}
        value={secsRaw}
        onChange={(e) => {
          onTouch();
          let val = e.target.value;
          if (val.length > 2) val = val.slice(-2);
          setSecsRaw(val);
          update(minsRaw, val);
        }}
        onBlur={() => {
          if (secsRaw !== '') setSecsRaw(secsRaw.padStart(2, '0'));
        }}
        aria-label="Seconds"
        placeholder="SS"
      />
    </div>
  );
}

function HamrDualInput({
  value,
  onChange,
  onTouch,
}: {
  value: number;
  onChange: (val: number) => void;
  onTouch: () => void;
}) {
  const levelInfo = getHamrLevel(value) || { level: 1, shuttle: 1, totalInLevel: 7 };
  const [totalStr, setTotalStr] = useState(() => (value > 0 ? String(value) : ''));
  const [currentLevel, setCurrentLevel] = useState(levelInfo.level);
  const [currentShuttle, setCurrentShuttle] = useState(levelInfo.shuttle);

  useEffect(() => {
    if (value > 0) {
      setTotalStr(String(value));
      const info = getHamrLevel(value);
      if (info) {
        setCurrentLevel(info.level);
        setCurrentShuttle(info.shuttle);
      }
    } else {
      setTotalStr('');
      setCurrentLevel(1);
      setCurrentShuttle(1);
    }
  }, [value]);

  const handleTotalChange = (str: string) => {
    onTouch();
    setTotalStr(str);
    const num = parseInt(str, 10);
    if (!isNaN(num) && num > 0) {
      onChange(num);
      const info = getHamrLevel(num);
      if (info) {
        setCurrentLevel(info.level);
        setCurrentShuttle(info.shuttle);
      }
    } else {
      onChange(0);
    }
  };

  const handleLevelChange = (lvl: number) => {
    onTouch();
    setCurrentLevel(lvl);
    const maxInLvl = getMaxShuttlesInLevel(lvl);
    const shuttle = Math.min(currentShuttle, maxInLvl);
    setCurrentShuttle(shuttle);
    const total = getHamrShuttles(lvl, shuttle);
    setTotalStr(String(total));
    onChange(total);
  };

  const handleShuttleChange = (shuttle: number) => {
    onTouch();
    setCurrentShuttle(shuttle);
    const total = getHamrShuttles(currentLevel, shuttle);
    setTotalStr(String(total));
    onChange(total);
  };

  const maxInCurrentLvl = getMaxShuttlesInLevel(currentLevel);

  return (
    <div className="hamr-dual-input-container">
      <div className="hamr-dual-row">
        <div className="hamr-input-box">
          <label className="hamr-input-sublabel">Total Shuttles</label>
          <input
            type="number"
            min={1}
            max={200}
            value={totalStr}
            onChange={(e) => handleTotalChange(e.target.value)}
            onFocus={() => { if (totalStr === '0') setTotalStr(''); }}
            placeholder="e.g. 50"
            className="hamr-total-input"
            aria-label="Total HAMR Shuttles"
          />
        </div>

        <div className="hamr-sync-divider">
          <span className="hamr-sync-symbol">⇄</span>
          <span className="hamr-sync-text">OR</span>
        </div>

        <div className="hamr-input-box">
          <label className="hamr-input-sublabel">Level &amp; Shuttle</label>
          <div className="hamr-selectors-row">
            <select
              className="hamr-select"
              value={currentLevel}
              onChange={(e) => handleLevelChange(Number(e.target.value))}
              aria-label="HAMR Level"
            >
              {HAMR_LEVELS.map((lvl) => (
                <option key={lvl.level} value={lvl.level}>
                  Level {lvl.level}
                </option>
              ))}
            </select>
            <span className="hamr-separator">·</span>
            <select
              className="hamr-select"
              value={currentShuttle}
              onChange={(e) => handleShuttleChange(Number(e.target.value))}
              aria-label="Shuttle in Level"
            >
              {Array.from({ length: maxInCurrentLvl }, (_, i) => i + 1).map((s) => (
                <option key={s} value={s}>
                  Shuttle {s} / {maxInCurrentLvl}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
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
  walkPassFail,
  hamrLevel,
  paceInfo,
  exempt = false,
  onToggleExempt,
}: EventInputProps) {
  const [touched, setTouched] = useState(false);
  const [rawInput, setRawInput] = useState(() => value > 0 ? String(value) : '');

  // Keep rawInput in sync with value prop (e.g. when switching event types)
  useEffect(() => {
    setRawInput(value > 0 ? String(value) : '');
  }, [value]);

  const timeBased = TIME_BASED_EVENTS.includes(selectedType);
  const error = touched ? validateEvent(selectedType, value) : null;
  const labelId = `label-${sectionLabel.toLowerCase().replace(/\W+/g, '-')}`;

  return (
    <div className="form-group">
      <div className="exempt-header">
        <label id={labelId}>
          {sectionLabel} ({maxPts} PTS){exempt && <span className="exempt-badge" style={{ marginLeft: '0.5rem' }}>Exempt</span>}
        </label>
        {onToggleExempt && (
          <label className={`exempt-toggle ${exempt ? 'active' : ''}`}>
            <input type="checkbox" checked={exempt} onChange={onToggleExempt} />
            Exempt
          </label>
        )}
      </div>

      <div className={`exempt-section-body ${exempt ? 'collapsed' : 'expanded'}`}>

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
        <TimeInput key={selectedType} value={value} onChange={onChange} onTouch={() => setTouched(true)} />
      ) : selectedType === 'hamr' ? (
        <HamrDualInput key="hamr-dual" value={value} onChange={onChange} onTouch={() => setTouched(true)} />
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
          onFocus={() => {
            if (rawInput === '0') {
              setRawInput('');
            }
          }}
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

      {walkPassFail && (
        <div className="threshold-hint">
          <div className="threshold-item tier-min">
            <span className="threshold-label">Pass</span>
            <span className="threshold-val highlight-min">
              ≤ {formatValue(walkPassFail.threshold, 'walk')}
            </span>
          </div>
          <div className={`threshold-item threshold-item-you ${walkPassFail.passed === null ? 'tier-none' : walkPassFail.passed ? 'tier-max' : 'tier-fail'}`}>
            <span className="threshold-label">You</span>
            <span className={`threshold-val ${walkPassFail.passed === null ? 'score-none' : walkPassFail.passed ? 'highlight-max' : 'score-fail'}`}>
              {walkPassFail.passed === null ? '—' : walkPassFail.passed ? 'PASS' : 'FAIL'}
            </span>
          </div>
        </div>
      )}

      {hamrLevel && selectedType !== 'hamr' && (
        <div className="hamr-level-badge">
          <span className="hamr-level-label">HAMR Level</span>
          <span className="hamr-level-value">
            {hamrLevel.level <= HAMR_LEVELS.length
              ? `${hamrLevel.level} — Shuttle ${hamrLevel.shuttle} / ${hamrLevel.totalInLevel}`
              : `${hamrLevel.level}+`}
          </span>
        </div>
      )}

      {paceInfo && (
        <div className="pace-info">
          <span className="pace-label">Suggested Pace</span>
          <span className="pace-item">{paceInfo.perMile}<span className="pace-unit">/mi</span></span>
        </div>
      )}
      </div>{/* end exempt-section-body */}
    </div>
  );
}
