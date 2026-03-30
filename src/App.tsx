import { useState, useMemo } from 'react';
import './index.css';
import rawScoringData from './scoringData.json';
import type { ScoringTable } from './types';
import {
  AGE_GROUPS,
  TABLE_MAP,
  PASS_THRESHOLD,
  DEFAULT_VALUES,
  getColIdx,
  calculateScore,
  getKeyThresholds,
} from './scoring';
import { EventInput } from './components/EventInput';
import type { EventOption } from './components/EventInput';

const scoringData = rawScoringData as ScoringTable[];

function getTable(id: number): ScoringTable | undefined {
  return scoringData.find(t => t.id === id);
}

const CARDIO_OPTIONS: EventOption[] = [
  { value: 'run', label: 'Run' },
  { value: 'hamr', label: '20m HAMR' },
];

const STRENGTH_OPTIONS: EventOption[] = [
  { value: 'pushup', label: 'Push-ups' },
  { value: 'handrelease', label: 'HR Push-ups' },
];

const CORE_OPTIONS: EventOption[] = [
  { value: 'situp', label: 'Sit-ups' },
  { value: 'crunches', label: 'Cross-Leg Crunches' },
  { value: 'plank', label: 'Forearm Plank' },
];

function App() {
  const [gender, setGender] = useState('male');
  const [ageGroup, setAgeGroup] = useState('<25');

  const [whtrValue, setWhtrValue] = useState(DEFAULT_VALUES.whtr);
  const [cardioType, setCardioType] = useState('run');
  const [cardioValue, setCardioValue] = useState(DEFAULT_VALUES.run);
  const [strengthType, setStrengthType] = useState('pushup');
  const [strengthValue, setStrengthValue] = useState(DEFAULT_VALUES.pushup);
  const [coreType, setCoreType] = useState('situp');
  const [coreValue, setCoreValue] = useState(DEFAULT_VALUES.situp);

  const colIdx = useMemo(() => getColIdx(ageGroup, gender), [ageGroup, gender]);

  const whtrScore = useMemo(() => {
    const table = getTable(TABLE_MAP.whtr);
    return table ? calculateScore(table, colIdx, whtrValue) : 0;
  }, [whtrValue, colIdx]);

  const cardioScore = useMemo(() => {
    const table = getTable(TABLE_MAP[cardioType as keyof typeof TABLE_MAP]);
    return table ? calculateScore(table, colIdx, cardioValue) : 0;
  }, [cardioType, cardioValue, colIdx]);

  const strengthScore = useMemo(() => {
    const table = getTable(TABLE_MAP[strengthType as keyof typeof TABLE_MAP]);
    return table ? calculateScore(table, colIdx, strengthValue) : 0;
  }, [strengthType, strengthValue, colIdx]);

  const coreScore = useMemo(() => {
    const table = getTable(TABLE_MAP[coreType as keyof typeof TABLE_MAP]);
    return table ? calculateScore(table, colIdx, coreValue) : 0;
  }, [coreType, coreValue, colIdx]);

  const totalScore = Math.round(cardioScore + strengthScore + coreScore + whtrScore);
  const isPass = totalScore >= PASS_THRESHOLD && cardioScore > 0 && strengthScore > 0 && coreScore > 0;

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

  const handleCardioTypeChange = (type: string) => {
    setCardioType(type);
    setCardioValue(DEFAULT_VALUES[type]);
  };

  const handleStrengthTypeChange = (type: string) => {
    setStrengthType(type);
    setStrengthValue(DEFAULT_VALUES[type]);
  };

  const handleCoreTypeChange = (type: string) => {
    setCoreType(type);
    setCoreValue(DEFAULT_VALUES[type]);
  };

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
        <h3 className="section-title">Assessment Events</h3>

        <EventInput
          sectionLabel="Waist-To-Height Ratio"
          maxPts={20}
          selectedType="whtr"
          value={whtrValue}
          onChange={setWhtrValue}
          placeholder="Ratio (e.g. 0.49)"
          thresholds={whtrThresholds}
          valueType="whtr"
        />

        <EventInput
          key={cardioType}
          sectionLabel="Cardiorespiratory"
          maxPts={50}
          options={CARDIO_OPTIONS}
          selectedType={cardioType}
          onTypeChange={handleCardioTypeChange}
          value={cardioValue}
          onChange={setCardioValue}
          placeholder="Total Shuttles"
          thresholds={cardioThresholds}
          valueType={cardioType}
        />

        <EventInput
          key={strengthType}
          sectionLabel="Upper Body Strength"
          maxPts={15}
          options={STRENGTH_OPTIONS}
          selectedType={strengthType}
          onTypeChange={handleStrengthTypeChange}
          value={strengthValue}
          onChange={setStrengthValue}
          placeholder="Repetitions"
          thresholds={strengthThresholds}
          valueType={strengthType}
        />

        <EventInput
          key={coreType}
          sectionLabel="Core Strength"
          maxPts={15}
          options={CORE_OPTIONS}
          selectedType={coreType}
          onTypeChange={handleCoreTypeChange}
          value={coreValue}
          onChange={setCoreValue}
          placeholder="Repetitions"
          thresholds={coreThresholds}
          valueType={coreType}
        />
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
