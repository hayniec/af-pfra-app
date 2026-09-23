import { useState, useMemo, useEffect } from 'react';
import './index.css';
import rawScoringData from './scoringData.json';
import type { ScoringTable, Exemptions } from './types';
import { DEFAULT_EXEMPTIONS } from './types';
import {
  AGE_GROUPS,
  TABLE_MAP,
  PASS_THRESHOLD,
  DEFAULT_VALUES,
  getColIdx,
  calculateScore,
  roundWhtr,
  getKeyThresholds,
  getWalkThreshold,
  getHamrLevel,
  getRunPace,
} from './scoring';
import { HamrPlayer } from './components/HamrPlayer';
import { RunTracker } from './components/RunTracker';
import { PlankTimer } from './components/PlankTimer';
import { GoalLookup } from './components/GoalLookup';
import { ScoreHistory } from './components/ScoreHistory';
import { EventInput } from './components/EventInput';
import type { EventOption } from './components/EventInput';
import { useHistory } from './hooks/useHistory';
import { useProfile } from './hooks/useProfile';
import { WhtrInput } from './components/WhtrInput';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';

const scoringData = rawScoringData as ScoringTable[];

function getTable(id: number): ScoringTable | undefined {
  return scoringData.find(t => t.id === id);
}

const CARDIO_OPTIONS: EventOption[] = [
  { value: 'run', label: 'Run' },
  { value: 'hamr', label: '20m HAMR' },
  { value: 'walk', label: '1.2mi Walk' },
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
  const {
    profile,
    updateProfile,
    setRememberLastValues,
    updateLastValues,
    clearProfile,
  } = useProfile();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const { entries, save, remove, clearAll, importEntries } = useHistory();

  const [exemptions, setExemptions] = useState<Exemptions>(DEFAULT_EXEMPTIONS);
  const [assessmentType, setAssessmentType] = useState<'official' | 'diagnostic'>('official');

  // Outdoor / High-Contrast Track Sunlight Theme
  const [theme, setTheme] = useState<'dark' | 'outdoor'>(() => {
    return (localStorage.getItem('pfra_theme') as 'dark' | 'outdoor') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pfra_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'outdoor' : 'dark'));
  };

  const toggleExempt = (component: keyof Exemptions) => {
    setExemptions(prev => ({ ...prev, [component]: !prev[component] }));
  };

  // Initialize event types & values from profile.lastValues if rememberLastValues is enabled
  const [cardioType, setCardioType] = useState<string>(() =>
    profile.rememberLastValues && profile.lastValues?.cardioType
      ? profile.lastValues.cardioType
      : 'run'
  );
  const [cardioValue, setCardioValue] = useState<number>(() =>
    profile.rememberLastValues && profile.lastValues?.cardioValue !== undefined
      ? profile.lastValues.cardioValue
      : DEFAULT_VALUES.run
  );
  const [strengthType, setStrengthType] = useState<string>(() =>
    profile.rememberLastValues && profile.lastValues?.strengthType
      ? profile.lastValues.strengthType
      : 'pushup'
  );
  const [strengthValue, setStrengthValue] = useState<number>(() =>
    profile.rememberLastValues && profile.lastValues?.strengthValue !== undefined
      ? profile.lastValues.strengthValue
      : DEFAULT_VALUES.pushup
  );
  const [coreType, setCoreType] = useState<string>(() =>
    profile.rememberLastValues && profile.lastValues?.coreType
      ? profile.lastValues.coreType
      : 'situp'
  );
  const [coreValue, setCoreValue] = useState<number>(() =>
    profile.rememberLastValues && profile.lastValues?.coreValue !== undefined
      ? profile.lastValues.coreValue
      : DEFAULT_VALUES.situp
  );
  const [waistValue, setWaistValue] = useState<number | null>(() =>
    profile.rememberLastValues && profile.lastValues?.waist !== undefined
      ? profile.lastValues.waist
      : null
  );

  const [whtrValue, setWhtrValue] = useState(DEFAULT_VALUES.whtr);

  const gender = profile.gender;
  const ageGroup = profile.ageGroup;

  const colIdx = useMemo(() => getColIdx(ageGroup, gender), [ageGroup, gender]);

  const whtrScore = useMemo(() => {
    // No measurement yet — a ratio of 0 is "not entered", not a perfect 0.49
    if (whtrValue <= 0) return 0;
    const table = getTable(TABLE_MAP.whtr);
    // The chart is written in hundredths, so the measured ratio is rounded to two
    // decimals before lookup — otherwise 34.5"/70" (0.4929) falls to the 0.50 row.
    return table ? calculateScore(table, colIdx, roundWhtr(whtrValue)) : 0;
  }, [whtrValue, colIdx]);

  const cardioScore = useMemo(() => {
    if (cardioType === 'walk') return 0;
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

  const walkPassFail = useMemo(() => {
    if (cardioType !== 'walk') return null;
    const threshold = getWalkThreshold(ageGroup, gender);
    const passed = cardioValue > 0 ? cardioValue <= threshold : null;
    return { threshold, passed };
  }, [cardioType, cardioValue, ageGroup, gender]);

  const isAllExempt = exemptions.whtr && exemptions.cardio && exemptions.strength && exemptions.core;

  const cardioMax = exemptions.cardio || cardioType === 'walk' ? 0 : 50;
  const scoredMax =
    (exemptions.whtr ? 0 : 20) +
    cardioMax +
    (exemptions.strength ? 0 : 15) +
    (exemptions.core ? 0 : 15);

  const earnedPts =
    (exemptions.whtr ? 0 : whtrScore) +
    (exemptions.cardio ? 0 : cardioScore) +
    (exemptions.strength ? 0 : strengthScore) +
    (exemptions.core ? 0 : coreScore);

  const isPassFailOnly = !isAllExempt && scoredMax === 0;

  const totalScore = scoredMax > 0
    ? Math.round(((earnedPts / scoredMax) * 100) * 10) / 10
    : 0;

  const cardioPass = exemptions.cardio
    ? true
    : cardioType === 'walk'
    ? (walkPassFail?.passed === true)
    : cardioScore > 0;
  const strengthPass = exemptions.strength || strengthScore > 0;
  const corePass = exemptions.core || coreScore > 0;

  const isPass = isAllExempt
    ? false
    : isPassFailOnly
    ? (walkPassFail?.passed === true)
    : (totalScore >= PASS_THRESHOLD && cardioPass && strengthPass && corePass);

  const whtrThresholds = useMemo(() => {
    const table = getTable(TABLE_MAP.whtr);
    return table ? getKeyThresholds(table, colIdx) : null;
  }, [colIdx]);

  const cardioThresholds = useMemo(() => {
    if (cardioType === 'walk') return null;
    const table = getTable(TABLE_MAP[cardioType as keyof typeof TABLE_MAP]);
    return table ? getKeyThresholds(table, colIdx) : null;
  }, [cardioType, colIdx]);

  const hamrLevel = useMemo(() => {
    if (cardioType !== 'hamr' || cardioValue <= 0) return null;
    return getHamrLevel(cardioValue);
  }, [cardioType, cardioValue]);

  const runPace = useMemo(() => {
    if (cardioType !== 'run') return null;
    return getRunPace(cardioValue);
  }, [cardioType, cardioValue]);

  const strengthThresholds = useMemo(() => {
    const table = getTable(TABLE_MAP[strengthType as keyof typeof TABLE_MAP]);
    return table ? getKeyThresholds(table, colIdx) : null;
  }, [strengthType, colIdx]);

  const coreThresholds = useMemo(() => {
    const table = getTable(TABLE_MAP[coreType as keyof typeof TABLE_MAP]);
    return table ? getKeyThresholds(table, colIdx) : null;
  }, [coreType, colIdx]);

  // Handle updates to event selections & values
  const handleCardioTypeChange = (type: string) => {
    setCardioType(type);
    const val = DEFAULT_VALUES[type];
    setCardioValue(val);
    if (profile.rememberLastValues) {
      updateLastValues({ cardioType: type, cardioValue: val });
    }
  };

  const handleCardioValueChange = (val: number) => {
    setCardioValue(val);
    if (profile.rememberLastValues) {
      updateLastValues({ cardioValue: val });
    }
  };

  const handleStrengthTypeChange = (type: string) => {
    setStrengthType(type);
    const val = DEFAULT_VALUES[type];
    setStrengthValue(val);
    if (profile.rememberLastValues) {
      updateLastValues({ strengthType: type, strengthValue: val });
    }
  };

  const handleStrengthValueChange = (val: number) => {
    setStrengthValue(val);
    if (profile.rememberLastValues) {
      updateLastValues({ strengthValue: val });
    }
  };

  const handleCoreTypeChange = (type: string) => {
    setCoreType(type);
    const val = DEFAULT_VALUES[type];
    setCoreValue(val);
    if (profile.rememberLastValues) {
      updateLastValues({ coreType: type, coreValue: val });
    }
  };

  const handleCoreValueChange = (val: number) => {
    setCoreValue(val);
    if (profile.rememberLastValues) {
      updateLastValues({ coreValue: val });
    }
  };

  const handleHeightChange = (height: number | null) => {
    updateProfile({ height, heightUnit: 'in' });
  };

  const handleWaistChange = (waist: number | null) => {
    setWaistValue(waist);
    if (profile.rememberLastValues && waist !== null) {
      updateLastValues({ waist });
    }
  };

  const canSave = !isAllExempt && (isPassFailOnly ? walkPassFail?.passed !== null : (earnedPts > 0 || totalScore > 0));

  const handleSave = () => {
    save({
      ageGroup, gender,
      cardioType, cardioValue,
      strengthType, strengthValue,
      coreType, coreValue,
      whtrValue,
      compositeScore: totalScore,
      passed: isPass,
      whtrScore, cardioScore, strengthScore, coreScore,
      exemptions,
      assessmentType,
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  return (
    <div className="container">
      <header className="animate-fade-in header-container">
        <div className="header-top-row">
          <h1>AIR FORCE PFRA</h1>
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle Track Sunlight Mode"
            title="Toggle Outdoor / Track Sunlight High-Contrast Mode"
          >
            {theme === 'outdoor' ? '🌙 Dark Mode' : '☀️ Track Mode'}
          </button>
        </div>
        <p>Physical Fitness Readiness Assessment Calculator</p>
      </header>

      <div className="card animate-fade-in delay-1">
        <div className="card-header-with-actions">
          <h3 className="section-title" style={{ marginBottom: 0 }}>Member Profile</h3>
          <div className="profile-actions-row">
            <span className="profile-saved-badge" title="Profile saved to browser local storage">
              ✓ Saved Locally
            </span>
            <button
              type="button"
              className="settings-gear-btn"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Open profile settings"
              title="Profile Settings"
            >
              ⚙️ Settings
            </button>
          </div>
        </div>

        <div className="input-row" style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => updateProfile({ gender: e.target.value })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="ageGroup">Age Group</label>
            <select
              id="ageGroup"
              value={ageGroup}
              onChange={(e) => updateProfile({ ageGroup: e.target.value })}
            >
              {AGE_GROUPS.map(age => (
                <option key={age} value={age}>{age === '<25' ? 'Under 25' : age}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card animate-fade-in delay-2">
        <h3 className="section-title">Assessment Events</h3>

        <WhtrInput
          onChange={setWhtrValue}
          thresholds={whtrThresholds}
          score={whtrScore}
          heightValue={profile.height}
          onHeightChange={handleHeightChange}
          waistValue={waistValue}
          onWaistChange={handleWaistChange}
          exempt={exemptions.whtr}
          onToggleExempt={() => toggleExempt('whtr')}
        />

        <GoalLookup
          colIdx={colIdx}
          ageGroup={ageGroup}
          gender={gender}
          cardioType={cardioType}
          strengthType={strengthType}
          coreType={coreType}
          whtrScore={whtrScore}
          exemptions={exemptions}
        />

        <EventInput
          key={cardioType}
          sectionLabel="Cardiorespiratory"
          maxPts={50}
          options={CARDIO_OPTIONS}
          selectedType={cardioType}
          onTypeChange={handleCardioTypeChange}
          value={cardioValue}
          onChange={handleCardioValueChange}
          placeholder={cardioType === 'hamr' ? 'Total Shuttles' : 'Enter value'}
          thresholds={cardioThresholds}
          valueType={cardioType}
          score={cardioType === 'walk' ? undefined : cardioScore}
          walkPassFail={walkPassFail}
          hamrLevel={hamrLevel}
          paceInfo={runPace}
          exempt={exemptions.cardio}
          onToggleExempt={() => toggleExempt('cardio')}
        />
        {!exemptions.cardio && cardioType === 'hamr' && <HamrPlayer onComplete={(shuttles) => handleCardioValueChange(shuttles)} />}
        {!exemptions.cardio && cardioType === 'run' && <RunTracker onComplete={(secs) => handleCardioValueChange(secs)} />}

        <EventInput
          key={strengthType}
          sectionLabel="Upper Body Strength"
          maxPts={15}
          options={STRENGTH_OPTIONS}
          selectedType={strengthType}
          onTypeChange={handleStrengthTypeChange}
          value={strengthValue}
          onChange={handleStrengthValueChange}
          placeholder="Repetitions"
          thresholds={strengthThresholds}
          valueType={strengthType}
          score={strengthScore}
          exempt={exemptions.strength}
          onToggleExempt={() => toggleExempt('strength')}
        />

        <EventInput
          key={coreType}
          sectionLabel="Core Strength"
          maxPts={15}
          options={CORE_OPTIONS}
          selectedType={coreType}
          onTypeChange={handleCoreTypeChange}
          value={coreValue}
          onChange={handleCoreValueChange}
          placeholder="Repetitions"
          thresholds={coreThresholds}
          valueType={coreType}
          score={coreScore}
          exempt={exemptions.core}
          onToggleExempt={() => toggleExempt('core')}
        />
        {!exemptions.core && coreType === 'plank' && (
          <PlankTimer
            initialSeconds={coreValue}
            onApplyTime={(secs) => handleCoreValueChange(secs)}
          />
        )}
      </div>

      <div className="score-display animate-fade-in delay-3" aria-live="polite">
        <p className="score-label">Composite Score</p>
        {isAllExempt ? (
          <div className="all-exempt-warning" style={{ margin: '1rem 0' }}>
            <strong>All Components Exempt</strong>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', opacity: 0.85 }}>
              No fitness components remain to assess. Airman has a full medical exemption.
            </p>
          </div>
        ) : isPassFailOnly ? (
          <>
            <h2>PASS / FAIL</h2>
            <div className={`score-status ${walkPassFail?.passed === true ? 'status-pass' : 'status-fail'}`}>
              {walkPassFail?.passed === true ? 'Satisfactory' : (walkPassFail?.passed === false ? 'Unsatisfactory' : 'Walk Time Required')}
            </div>
          </>
        ) : (
          <>
            <h2>{totalScore.toFixed(1)}</h2>
            <div className={`score-status ${isPass ? (totalScore >= 90 ? 'status-excellent' : 'status-pass') : 'status-fail'}`}>
              {isPass ? (totalScore >= 90 ? 'Excellent' : 'Satisfactory') : 'Unsatisfactory'}
            </div>
          </>
        )}
        <div className="score-breakdown">
          <div className={`component-score ${exemptions.whtr ? 'component-exempt' : ''}`}>
            <span className="component-label">WHtR Score:</span>
            <span className="component-value">{exemptions.whtr ? 'Exempt' : `${whtrScore.toFixed(1)} / 20`}</span>
          </div>
          <div className={`component-score ${exemptions.cardio ? 'component-exempt' : ''}`}>
            <span className="component-label">Cardio Score:</span>
            <span className="component-value">
              {exemptions.cardio
                ? 'Exempt'
                : cardioType === 'walk'
                ? (walkPassFail?.passed === true ? 'Pass' : walkPassFail?.passed === false ? 'Fail' : 'Walk (P/F)')
                : `${cardioScore.toFixed(1)} / 50`}
            </span>
          </div>
          <div className={`component-score ${exemptions.strength ? 'component-exempt' : ''}`}>
            <span className="component-label">Strength Score:</span>
            <span className="component-value">{exemptions.strength ? 'Exempt' : `${strengthScore.toFixed(1)} / 15`}</span>
          </div>
          <div className={`component-score ${exemptions.core ? 'component-exempt' : ''}`}>
            <span className="component-label">Core Score:</span>
            <span className="component-value">{exemptions.core ? 'Exempt' : `${coreScore.toFixed(1)} / 15`}</span>
          </div>
        </div>

        <div className="assessment-type-container">
          <div className="assessment-type-header">
            <span className="assessment-type-label">Assessment Type</span>
            <span className="assessment-type-hint">(AFMAN 36-2905 §3.8)</span>
          </div>
          <div className="type-toggle-group">
            <button
              type="button"
              className={`type-toggle-btn ${assessmentType === 'official' ? 'active' : ''}`}
              onClick={() => setAssessmentType('official')}
            >
              ★ Official PFRA
            </button>
            <button
              type="button"
              className={`type-toggle-btn ${assessmentType === 'diagnostic' ? 'active' : ''}`}
              onClick={() => setAssessmentType('diagnostic')}
            >
              🎯 Diagnostic (DPFRA)
            </button>
          </div>
        </div>

        <button
          className={`save-btn ${savedFeedback ? 'save-btn-saved' : ''}`}
          onClick={handleSave}
          disabled={!canSave || savedFeedback}
        >
          {savedFeedback ? '✓ Saved!' : `Save ${assessmentType === 'diagnostic' ? 'Diagnostic' : 'Official'} Results`}
        </button>
      </div>

      <ScoreHistory
        entries={entries}
        onRemove={remove}
        onClearAll={clearAll}
        onImport={importEntries}
      />

      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onUpdateProfile={updateProfile}
        onToggleRemember={setRememberLastValues}
        onClearProfile={clearProfile}
      />
    </div>
  );
}

export default App;
