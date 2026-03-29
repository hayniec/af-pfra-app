import { useState, useMemo } from 'react';
import './index.css';
import scoringData from './scoringData.json';

const AGE_GROUPS = ["<25", "25-29", "30-34", "35-39", "40-44", "45-49", "50-54", "55-59", "60+"];

const TABLE_MAP = {
  whtr: 0,
  crunches: 1,
  pushup: 2,
  handrelease: 3,
  situp: 4,
  plank: 5,
  run: 6,
  hamr: 7
};

const TIME_BASED_EVENTS = ['plank', 'run'];

function App() {
  const [gender, setGender] = useState('male');
  const [ageGroup, setAgeGroup] = useState('<25');
  
  const [whtrValue, setWhtrValue] = useState<number>(0.50);

  const [cardioType, setCardioType] = useState('run');
  const [cardioValue, setCardioValue] = useState<number>(14.00); 
  
  const [strengthType, setStrengthType] = useState('pushup');
  const [strengthValue, setStrengthValue] = useState<number>(45);
  
  const [coreType, setCoreType] = useState('situp');
  const [coreValue, setCoreValue] = useState<number>(50);

  const calculateScoreFixed = (tableId: number, value: number) => {
    const table: any = scoringData.find(t => t.id === tableId);
    if (!table) return 0;
    
    const ageIdx = AGE_GROUPS.indexOf(ageGroup);
    const colIdx = ageIdx * 2 + (gender === 'female' ? 1 : 0);
    
    const sortedRows = [...table.rows].sort((a, b) => b.score - a.score);
    
    let earned = 0;
    for (const row of sortedRows) {
      const targetVal = row.values[colIdx];
      
      if (table.isLowerBetter) {
        if (value <= targetVal) {
          earned = row.score;
          break;
        }
      } else {
        if (value >= targetVal) {
          earned = row.score;
          break;
        }
      }
    }
    
    return earned;
  };

  const formatValue = (val: number, type: string) => {
    if (TIME_BASED_EVENTS.includes(type)) {
      const mins = Math.floor(val / 60);
      const secs = val % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    if (type === 'whtr') return val.toFixed(2);
    return val.toString();
  };

  // Returns key scoring thresholds for the target goals panel
  const getKeyThresholds = (tableId: number) => {
    const table: any = scoringData.find(t => t.id === tableId);
    if (!table) return null;

    const ageIdx = AGE_GROUPS.indexOf(ageGroup);
    const colIdx = ageIdx * 2 + (gender === 'female' ? 1 : 0);

    // Sort descending by score, skip score=0 rows (fail threshold)
    const scoringRows = [...table.rows]
      .sort((a, b) => b.score - a.score)
      .filter(r => r.score > 0);

    if (scoringRows.length === 0) return null;

    const maxRow = scoringRows[0];
    const minRow = scoringRows[scoringRows.length - 1];

    // Pick a "good" mid-tier row around 80% of max score
    const targetScore = maxRow.score * 0.8;
    const goodRow = scoringRows.reduce((prev, curr) =>
      Math.abs(curr.score - targetScore) < Math.abs(prev.score - targetScore) ? curr : prev
    );

    return {
      isLowerBetter: table.isLowerBetter,
      max: { pts: maxRow.score, val: maxRow.values[colIdx] },
      good: { pts: goodRow.score, val: goodRow.values[colIdx] },
      min: { pts: minRow.score, val: minRow.values[colIdx] },
    };
  };

  const whtrScore = useMemo(() => calculateScoreFixed(TABLE_MAP.whtr, whtrValue), [whtrValue, ageGroup, gender]);
  
  // Format input value for lookup if time-based (e.g. 13.25 -> 805 seconds)
  const parseInputValue = (val: number, type: string) => {
    if (TIME_BASED_EVENTS.includes(type)) {
      return Math.floor(val) * 60 + Math.round((val % 1) * 100);
    }
    return val;
  };

  const cardioScore = useMemo(() => calculateScoreFixed(TABLE_MAP[cardioType as keyof typeof TABLE_MAP], parseInputValue(cardioValue, cardioType)), [cardioType, cardioValue, ageGroup, gender]);
  const strengthScore = useMemo(() => calculateScoreFixed(TABLE_MAP[strengthType as keyof typeof TABLE_MAP], strengthValue), [strengthType, strengthValue, ageGroup, gender]);
  const coreScore = useMemo(() => calculateScoreFixed(TABLE_MAP[coreType as keyof typeof TABLE_MAP], parseInputValue(coreValue, coreType)), [coreType, coreValue, ageGroup, gender]);
  
  const totalScore = Math.round(cardioScore + strengthScore + coreScore + whtrScore);
  const isPass = totalScore >= 75 && cardioScore > 0 && strengthScore > 0 && coreScore > 0;

  const renderThresholds = (tableId: number, type: string, label: string, maxPts: number) => {
    const t = getKeyThresholds(tableId);
    if (!t) return null;
    const sym = t.isLowerBetter ? '≤' : '≥';
    return (
      <div className="target-card">
        <div className="target-card-header">
          <h4>{label}</h4>
          <span className="target-max-pts">{maxPts} PTS</span>
        </div>
        <div className="range-box">
          <div className="range-item tier-max">
            <span className="range-label">🏆 Max</span>
            <span className="range-val highlight-max">{sym} {formatValue(t.max.val, type)}</span>
            <span className="range-pts">{t.max.pts} pts</span>
          </div>
          <div className="range-item tier-good">
            <span className="range-label">👍 Good</span>
            <span className="range-val highlight-good">{sym} {formatValue(t.good.val, type)}</span>
            <span className="range-pts">{t.good.pts} pts</span>
          </div>
          <div className="range-item tier-min">
            <span className="range-label">⚠️ Pass</span>
            <span className="range-val highlight-min">{sym} {formatValue(t.min.val, type)}</span>
            <span className="range-pts">{t.min.pts} pts</span>
          </div>
        </div>
      </div>
    );
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
            <label>Gender</label>
            <select title="Gender" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="form-group">
            <label>Age Group</label>
            <select title="Age Group" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}>
              {AGE_GROUPS.map(age => <option key={age} value={age}>{age === '<25' ? 'Under 25' : age}</option>)}
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
          {renderThresholds(TABLE_MAP.whtr, 'whtr', 'WHtR', 20)}
          {renderThresholds(TABLE_MAP[cardioType as keyof typeof TABLE_MAP], cardioType, cardioType === 'run' ? '1.5-Mile Run' : '20m HAMR', 50)}
          {renderThresholds(TABLE_MAP[strengthType as keyof typeof TABLE_MAP], strengthType, strengthType === 'pushup' ? 'Push-ups' : 'HR Push-ups', 15)}
          {renderThresholds(TABLE_MAP[coreType as keyof typeof TABLE_MAP], coreType, coreType === 'situp' ? 'Sit-ups' : coreType === 'crunches' ? 'Crunches' : 'Forearm Plank', 15)}
        </div>
      </div>

      <div className="card animate-fade-in delay-3">
        <h3 className="section-title">Assessment Events</h3>
        
        {/* WHtR */}
        <div className="form-group">
          <label>Waist-To-Height Ratio (20 PTS)</label>
          <input 
            type="number" 
            placeholder="Ratio (e.g. 0.49)"
            value={whtrValue || ''}
            onChange={(e) => setWhtrValue(Number(e.target.value))}
            step="0.01"
          />
        </div>

        {/* Cardio */}
        <div className="form-group">
          <label>Cardiorespiratory (50 PTS)</label>
          <div className="toggle-group toggle-group-mb">
            <button className={`toggle-btn ${cardioType === 'run' ? 'active' : ''}`} onClick={() => setCardioType('run')}>
              Run
            </button>
            <button className={`toggle-btn ${cardioType === 'hamr' ? 'active' : ''}`} onClick={() => setCardioType('hamr')}>
              20m HAMR Toggle
            </button>
          </div>
          <input 
            type="number" 
            placeholder={cardioType === 'run' ? 'Time (e.g. 13.25 for 13:25)' : 'Total Shuttles'}
            value={cardioValue || ''}
            onChange={(e) => setCardioValue(Number(e.target.value))}
            step={cardioType === 'run' ? "0.01" : "1"}
          />
        </div>

        {/* Strength */}
        <div className="form-group">
          <label>Upper Body Strength (15 PTS)</label>
          <div className="toggle-group toggle-group-mb">
            <button className={`toggle-btn ${strengthType === 'pushup' ? 'active' : ''}`} onClick={() => setStrengthType('pushup')}>
              Push-ups
            </button>
            <button className={`toggle-btn ${strengthType === 'handrelease' ? 'active' : ''}`} onClick={() => setStrengthType('handrelease')}>
              HR Push-ups
            </button>
          </div>
          <input 
            type="number" 
            placeholder="Repetitions"
            value={strengthValue || ''}
            onChange={(e) => setStrengthValue(Number(e.target.value))}
          />
        </div>

        {/* Core */}
        <div className="form-group">
          <label>Core Strength (15 PTS)</label>
          <div className="toggle-group toggle-group-mb">
            <button className={`toggle-btn ${coreType === 'situp' ? 'active' : ''}`} onClick={() => setCoreType('situp')}>
              Sit-ups
            </button>
            <button className={`toggle-btn ${coreType === 'crunches' ? 'active' : ''}`} onClick={() => setCoreType('crunches')}>
              Cross-Leg Crunches
            </button>
            <button className={`toggle-btn ${coreType === 'plank' ? 'active' : ''}`} onClick={() => setCoreType('plank')}>
              Forearm Plank
            </button>
          </div>
          <input 
            type="number" 
            placeholder={coreType === 'plank' ? 'Time (e.g. 3.40 for 3:40)' : 'Repetitions'}
            value={coreValue || ''}
            onChange={(e) => setCoreValue(Number(e.target.value))}
            step={coreType === 'plank' ? "0.01" : "1"}
          />
        </div>
      </div>

      <div className="score-display animate-fade-in delay-3">
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
