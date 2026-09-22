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
  calculateComposite,
  roundWhtr,
  getKeyThresholds,
  getWalkThreshold,
  getHamrLevel,
  getRunPace,
} from './scoring';
import { HamrPlayer } from './components/HamrPlayer';
import { RunTracker } from './components/RunTracker';
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
    const table = getTable(TABLE_MAP.whtr);
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

  const totalScore = calculateComposite(cardioScore, strengthScore, coreScore, whtrScore);
  const cardioPass = cardioType === 'walk'
    ? (walkPassFail?.passed === true)
    : cardioScore > 0;
  const isPass = totalScore >= PASS_THRESHOLD && cardioPass && strengthScore > 0 && coreScore > 0;

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

  const handleHeightChange = (height: number | null, unit: 'in' | 'cm') => {
    updateProfile({ height, heightUnit: unit });
  };

  const handleWaistChange = (waist: number | null) => {
    setWaistValue(waist);
    if (profile.rememberLastValues && waist !== null) {
      updateLastValues({ waist });
    }
  };

  const canSave = totalScore > 0;

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
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  return (
    <div className="container">
      <header className="animate-fade-in">
        <h1>AIR FORCE PFRA</h1>
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
          heightUnit={profile.heightUnit}
          onHeightChange={handleHeightChange}
          waistValue={waistValue}
          onWaistChange={handleWaistChange}
        />

        <GoalLookup
          colIdx={colIdx}
          ageGroup={ageGroup}
          gender={gender}
          cardioType={cardioType}
          strengthType={strengthType}
          coreType={coreType}
          whtrScore={whtrScore}
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
        />
        {cardioType === 'hamr' && <HamrPlayer onComplete={(shuttles) => handleCardioValueChange(shuttles)} />}
        {cardioType === 'run' && <RunTracker onComplete={(secs) => handleCardioValueChange(secs)} />}

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
        />
      </div>

      <div className="score-display animate-fade-in delay-3" aria-live="polite">
        <p className="score-label">Composite Score</p>
        <h2>{totalScore.toFixed(1)}</h2>
        <div className={`score-status ${isPass ? (totalScore >= 90 ? 'status-excellent' : 'status-pass') : 'status-fail'}`}>
          {isPass ? (totalScore >= 90 ? 'Excellent' : 'Satisfactory') : 'Unsatisfactory'}
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

        <button
          className={`save-btn ${savedFeedback ? 'save-btn-saved' : ''}`}
          onClick={handleSave}
          disabled={!canSave || savedFeedback}
        >
          {savedFeedback ? '✓ Saved!' : 'Save Results'}
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
