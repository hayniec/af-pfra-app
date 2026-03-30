import { useState } from 'react';
import rawScoringData from '../scoringData.json';
import type { ScoringTable } from '../types';
import {
  TABLE_MAP,
  formatValue,
  getValueForScore,
  getWalkThreshold,
} from '../scoring';

const TABLES = rawScoringData as ScoringTable[];
const getTable = (id: number) => TABLES.find(t => t.id === id) ?? null;

const TIERS = [
  { label: 'Pass',      score: 75  },
  { label: 'Good',      score: 80  },
  { label: 'Excellent', score: 90  },
  { label: 'Max',       score: 100 },
] as const;

const EVENT_MAX = { whtr: 20, cardio: 50, strength: 10, core: 20 } as const;

function tierPts(target: number, max: number): number {
  return Math.min(max, Math.ceil((target / 100) * max));
}

interface GoalLookupProps {
  colIdx: number;
  ageGroup: string;
  gender: string;
  cardioType: string;
  strengthType: string;
  coreType: string;
}

export function GoalLookup({
  colIdx,
  ageGroup,
  gender,
  cardioType,
  strengthType,
  coreType,
}: GoalLookupProps) {
  const [selectedTier, setSelectedTier] = useState(75);

  const cardioLabel: Record<string, string> = {
    run:  '2-Mile Run',
    hamr: '20m HAMR',
    walk: '1.2mi Walk',
  };
  const strengthLabel: Record<string, string> = {
    pushup:      'Push-ups',
    handrelease: 'Hand-Release Push-ups',
  };
  const coreLabel: Record<string, string> = {
    situp:    'Sit-ups',
    crunches: 'Cross-Leg Crunches',
    plank:    'Plank',
  };

  const whtrPts     = tierPts(selectedTier, EVENT_MAX.whtr);
  const cardioPts   = tierPts(selectedTier, EVENT_MAX.cardio);
  const strengthPts = tierPts(selectedTier, EVENT_MAX.strength);
  const corePts     = tierPts(selectedTier, EVENT_MAX.core);
  const totalPts    = (cardioType === 'walk' ? 0 : cardioPts) + strengthPts + corePts + whtrPts;

  const whtrVal     = getTable(TABLE_MAP.whtr) ? getValueForScore(getTable(TABLE_MAP.whtr)!, colIdx, whtrPts) : null;
  const cardioVal   = cardioType !== 'walk' && getTable(TABLE_MAP[cardioType as keyof typeof TABLE_MAP])
    ? getValueForScore(getTable(TABLE_MAP[cardioType as keyof typeof TABLE_MAP])!, colIdx, cardioPts)
    : null;
  const strengthVal = getTable(TABLE_MAP[strengthType as keyof typeof TABLE_MAP])
    ? getValueForScore(getTable(TABLE_MAP[strengthType as keyof typeof TABLE_MAP])!, colIdx, strengthPts)
    : null;
  const coreVal     = getTable(TABLE_MAP[coreType as keyof typeof TABLE_MAP])
    ? getValueForScore(getTable(TABLE_MAP[coreType as keyof typeof TABLE_MAP])!, colIdx, corePts)
    : null;

  const walkThreshold = cardioType === 'walk' ? getWalkThreshold(ageGroup, gender) : null;

  return (
    <section className="goal-lookup">
      <h2 className="section-title">What Do I Need?</h2>

      <div className="goal-tiers">
        {TIERS.map(t => (
          <button
            key={t.score}
            className={`goal-tier-btn ${selectedTier === t.score ? 'active' : ''}`}
            onClick={() => setSelectedTier(t.score)}
          >
            <span className="goal-tier-label">{t.label}</span>
            <span className="goal-tier-score">{t.score}</span>
          </button>
        ))}
      </div>

      <div className="goal-table">
        <div className="goal-header">
          <span>Event</span>
          <span>Need</span>
          <span>Points</span>
        </div>

        {/* WHTR */}
        <div className="goal-row">
          <span className="goal-event">Waist-to-Height</span>
          <span className="goal-val highlight-good">
            {whtrVal != null ? `≤ ${formatValue(whtrVal, 'whtr')}` : '—'}
          </span>
          <span className="goal-pts">{whtrPts} pts</span>
        </div>

        {/* Cardio */}
        {cardioType === 'walk' ? (
          <div className="goal-row">
            <span className="goal-event">{cardioLabel[cardioType]}</span>
            <span className="goal-val highlight-min">
              {walkThreshold != null ? `≤ ${formatValue(walkThreshold, 'walk')}` : '—'}
            </span>
            <span className="goal-pts goal-pass-required">Must PASS</span>
          </div>
        ) : (
          <div className="goal-row">
            <span className="goal-event">{cardioLabel[cardioType] ?? cardioType}</span>
            <span className="goal-val highlight-good">
              {cardioVal != null
                ? `${getTable(TABLE_MAP[cardioType as keyof typeof TABLE_MAP])?.isLowerBetter ? '≤' : '≥'} ${formatValue(cardioVal, cardioType)}`
                : '—'}
            </span>
            <span className="goal-pts">{cardioPts} pts</span>
          </div>
        )}

        {/* Strength */}
        <div className="goal-row">
          <span className="goal-event">{strengthLabel[strengthType] ?? strengthType}</span>
          <span className="goal-val highlight-good">
            {strengthVal != null ? `≥ ${formatValue(strengthVal, strengthType)}` : '—'}
          </span>
          <span className="goal-pts">{strengthPts} pts</span>
        </div>

        {/* Core */}
        <div className="goal-row">
          <span className="goal-event">{coreLabel[coreType] ?? coreType}</span>
          <span className="goal-val highlight-good">
            {coreVal != null
              ? `${getTable(TABLE_MAP[coreType as keyof typeof TABLE_MAP])?.isLowerBetter ? '≤' : '≥'} ${formatValue(coreVal, coreType)}`
              : '—'}
          </span>
          <span className="goal-pts">{corePts} pts</span>
        </div>

        {/* Total */}
        <div className="goal-total-row">
          <span></span>
          <span className="goal-total-label">Total</span>
          <span className={`goal-total-pts ${totalPts >= 75 ? 'highlight-min' : 'score-fail'}`}>
            {totalPts} pts
            {cardioType !== 'walk' && (
              <span className={`goal-pass-badge ${totalPts >= 75 ? 'badge-pass' : 'badge-fail'}`}>
                {totalPts >= 75 ? 'PASS' : 'FAIL'}
              </span>
            )}
          </span>
        </div>
      </div>

      {cardioType === 'walk' && (
        <p className="goal-walk-note">
          Walk is pass/fail — your total score is based on the other three events.
        </p>
      )}
    </section>
  );
}

