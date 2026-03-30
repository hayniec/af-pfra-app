import { useState, useMemo } from 'react';
import './index.css';
import rawScoringData from './scoringData.json';
import type { ScoringTable, KeyThresholds } from './types';
import {
  AGE_GROUPS,
  TABLE_MAP,
  TIME_BASED_EVENTS,
  PASS_THRESHOLD,
  getColIdx,
  calculateScore,
  getKeyThresholds,
  parseTimeInput,
  formatValue,
} from './scoring';

const scoringData = rawScoringData as ScoringTable[];

function getTable(id: number): ScoringTable | undefined {
  return scoringData.find(t => t.id === id);
}

// ---- TargetCard ----

interface TargetCardProps {
  thresholds: KeyThresholds;
  label: string;
  maxPts: number;
  valueType: string;
}

function TargetCard({ thresholds, label, maxPts, valueType }: TargetCardProps) {
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

// ---- App ----

function App() {
  const [gender, setGender] = useState('male');
  const [ageGroup, setAgeGroup] = useState('<25');

  const [whtrValue, setWhtrValue] = useState(0.50);
  const [cardioType, setCardioType] = useState('run');
  const [cardioValue, setCardioValue] = useState(14.00);
  const [strengthType, setStrengthType] = useState('pushup');
  const [strengthValue, setStrengthValue] = useState(45);
  const [coreType, setCoreType] = useState('situp');
  const [coreValue, setCoreValue] = useState(50);

  const colIdx = useMemo(() => getColIdx(ageGroup, gender), [ageGroup, gender]);

  const whtrScore = useMemo(() => {
    const table = getTable(TABLE_MAP.whtr);
    return table ? calculateScore(table, colIdx, whtrValue) : 0;
  }, [whtrValue, colIdx]);

  const cardioScore = useMemo(() => {
    const table = getTable(TABLE_MAP[cardioType as keyof typeof TABLE_MAP]);
    const val = TIME_BASED_EVENTS.includes(cardioType) ? parseTimeInput(cardioValue) : cardioValue;
    return table ? calculateScore(table, colIdx, val) : 0;
  }, [cardioType, cardioValue, colIdx]);

  const strengthScore = useMemo(() => {
    const table = getTable(TABLE_MAP[strengthType as keyof typeof TABLE_MAP]);
    return table ? calculateScore(table, colIdx, strengthValue) : 0;
  }, [strengthType, strengthValue, colIdx]);

  const coreScore = useMemo(() => {
    const table = getTable(TABLE_MAP[coreType as keyof typeof TABLE_MAP]);
    const val = TIME_BASED_EVENTS.includes(coreType) ? parseTimeInput(coreValue) : coreValue;
    return table ? calculateScore(table, colIdx, val) : 0;
  }, [coreType, coreValue, colIdx]);

  const totalScore = Math.round(cardioScore + strengthScore + coreScore + whtrScore);
  const isPass = totalScore >= PASS_THRESHOLD && cardioScore > 0 && strengthScore > 0 && coreScore > 0;

  const cardioLabel = cardioType === 'run' ? '1.5-Mile Run' : '20m HAMR';
  const strengthLabel = strengthType === 'pushup' ? 'Push-ups' : 'HR Push-ups';
  const coreLabel = coreType === 'situp' ? 'Sit-ups' : coreType === 'crunches' ? 'Crunches' : 'Forearm Plank';

  const whtrThresholds = useMemo(() => {
    const table = getTable(TABLE_MAP.whtr);
    return table ? getKeyThresholds(table, colIdx) : null;
  }, [colIdx]);

  const cardioThresholds = useMemo(() => {
    const table = getTable(TABLE_MAP[cardioType as keyof typeof TABLE_MAP]);
    return table ? getKeyThresholds(table, colIdx) : null;
  }, [cardioType, colIdx]);

  const strengthThresholds = useMemo(() => {
    const table = getTable(TABLE_MAP[strengthType as keyof typeof TABLE_MAP]);
    return table ? getKeyThresholds(table, colIdx) : null;
  }, [strengthType, colIdx]);

  const coreThresholds = useMemo(() => {
    const table = getTable(TABLE_MAP[coreType as keyof typeof TABLE_MAP]);
    return table ? getKeyThresholds(table, colIdx) : null;
  }, [coreType, colIdx]);

  return (
    <div className="container">
      <header className="animate-fade-in">
        <h1>AIR FORCE PFRA</h1>
        <p>Physical Fitness Readiness Assessment Calculator</p>
      </header>

      <div className="card animate-fade-in delay-1">
        <h3 className="section-title">Member Profile</h3>
        <div className="input-row">
          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="ageGroup">Age Group</label>
            <select id="ageGroup" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
              {AGE_GROUPS.map(age => (
                <option key={age} value={age}>{age === '<25' ? 'Under 25' : age}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card animate-fade-in delay-2">
        <h3 className="section-title">Target Goals</h3>
        <p className="targets-description">
          Based on your profile and selected events, these are the minimums to pass the component and the targets to achieve max points.
        </p>
        <div className="targets-grid">
          {whtrThresholds && <TargetCard thresholds={whtrThresholds} label="WHtR" maxPts={20} valueType="whtr" />}
          {cardioThresholds && <TargetCard thresholds={cardioThresholds} label={cardioLabel} maxPts={50} valueType={cardioType} />}
          {strengthThresholds && <TargetCard thresholds={strengthThresholds} label={strengthLabel} maxPts={15} valueType={strengthType} />}
          {coreThresholds && <TargetCard thresholds={coreThresholds} label={coreLabel} maxPts={15} valueType={coreType} />}
        </div>
      </div>

      <div className="card animate-fade-in delay-3">
        <h3 className="section-title">Assessment Events</h3>

        {/* WHtR */}
        <div className="form-group">
          <label htmlFor="whtr">Waist-To-Height Ratio (20 PTS)</label>
          <input
            id="whtr"
            type="number"
            placeholder="Ratio (e.g. 0.49)"
            value={whtrValue || ''}
            onChange={(e) => setWhtrValue(Number(e.target.value))}
            step="0.01"
          />
        </div>

        {/* Cardio */}
        <div className="form-group">
          <label id="cardio-label">Cardiorespiratory (50 PTS)</label>
          <div className="toggle-group toggle-group-mb" role="group" aria-labelledby="cardio-label">
            <button
              className={`toggle-btn ${cardioType === 'run' ? 'active' : ''}`}
              onClick={() => setCardioType('run')}
              aria-pressed={cardioType === 'run'}
            >
              Run
            </button>
            <button
              className={`toggle-btn ${cardioType === 'hamr' ? 'active' : ''}`}
              onClick={() => setCardioType('hamr')}
              aria-pressed={cardioType === 'hamr'}
            >
              20m HAMR
            </button>
          </div>
          <input
            type="number"
            placeholder={cardioType === 'run' ? 'Time (e.g. 13.25 for 13:25)' : 'Total Shuttles'}
            value={cardioValue || ''}
            onChange={(e) => setCardioValue(Number(e.target.value))}
            step={cardioType === 'run' ? '0.01' : '1'}
            aria-label={cardioType === 'run' ? 'Run time in MM.SS format' : 'Total HAMR shuttles'}
          />
        </div>

        {/* Strength */}
        <div className="form-group">
          <label id="strength-label">Upper Body Strength (15 PTS)</label>
          <div className="toggle-group toggle-group-mb" role="group" aria-labelledby="strength-label">
            <button
              className={`toggle-btn ${strengthType === 'pushup' ? 'active' : ''}`}
              onClick={() => setStrengthType('pushup')}
              aria-pressed={strengthType === 'pushup'}
            >
              Push-ups
            </button>
            <button
              className={`toggle-btn ${strengthType === 'handrelease' ? 'active' : ''}`}
              onClick={() => setStrengthType('handrelease')}
              aria-pressed={strengthType === 'handrelease'}
            >
              HR Push-ups
            </button>
          </div>
          <input
            type="number"
            placeholder="Repetitions"
            value={strengthValue || ''}
            onChange={(e) => setStrengthValue(Number(e.target.value))}
            aria-label="Push-up repetitions"
          />
        </div>

        {/* Core */}
        <div className="form-group">
          <label id="core-label">Core Strength (15 PTS)</label>
          <div className="toggle-group toggle-group-mb" role="group" aria-labelledby="core-label">
            <button
              className={`toggle-btn ${coreType === 'situp' ? 'active' : ''}`}
              onClick={() => setCoreType('situp')}
              aria-pressed={coreType === 'situp'}
            >
              Sit-ups
            </button>
            <button
              className={`toggle-btn ${coreType === 'crunches' ? 'active' : ''}`}
              onClick={() => setCoreType('crunches')}
              aria-pressed={coreType === 'crunches'}
            >
              Cross-Leg Crunches
            </button>
            <button
              className={`toggle-btn ${coreType === 'plank' ? 'active' : ''}`}
              onClick={() => setCoreType('plank')}
              aria-pressed={coreType === 'plank'}
            >
              Forearm Plank
            </button>
          </div>
          <input
            type="number"
            placeholder={coreType === 'plank' ? 'Time (e.g. 3.40 for 3:40)' : 'Repetitions'}
            value={coreValue || ''}
            onChange={(e) => setCoreValue(Number(e.target.value))}
            step={coreType === 'plank' ? '0.01' : '1'}
            aria-label={coreType === 'plank' ? 'Plank time in MM.SS format' : 'Core exercise repetitions'}
          />
        </div>
      </div>

      <div className="score-display animate-fade-in delay-3" aria-live="polite">
        <p className="score-label">Composite Score</p>
        <h2>{totalScore.toFixed(1)}</h2>
        <div className={`score-status ${isPass ? 'status-pass' : 'status-fail'}`}>
          {isPass ? 'Satisfactory / Excellent' : 'Unsatisfactory'}
        </div>
        <div className="score-breakdown">
          <div className="component-score">
            <span className="component-label">WHtR Score:</span>
            <span className="component-value">{whtrScore.toFixed(1)} / 20</span>
          </div>
          <div className="component-score">
            <span className="component-label">Cardio Score:</span>
            <span className="component-value">{cardioScore.toFixed(1)} / 50</span>
          </div>
          <div className="component-score">
            <span className="component-label">Strength Score:</span>
            <span className="component-value">{strengthScore.toFixed(1)} / 15</span>
          </div>
          <div className="component-score">
            <span className="component-label">Core Score:</span>
            <span className="component-value">{coreScore.toFixed(1)} / 15</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
