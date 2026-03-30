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

const EVENT_MAX = { whtr: 20, cardio: 50, strength: 15, core: 15 } as const;
const MAX_OTHERS = EVENT_MAX.cardio + EVENT_MAX.strength + EVENT_MAX.core; // 80

/**
 * Distributes `remaining` points across cardio/strength/core proportionally,
 * using the largest-remainder method so parts sum exactly to `remaining`.
 * Returns null if remaining exceeds what those three events can provide.
 */
function distributeRemaining(
  remaining: number,
): { cardio: number; strength: number; core: number } | null {
  if (remaining > MAX_OTHERS) return null;
  if (remaining <= 0) return { cardio: 0, strength: 0, core: 0 };

  const keys   = ['cardio', 'strength', 'core'] as const;
  const maxes  = { cardio: EVENT_MAX.cardio, strength: EVENT_MAX.strength, core: EVENT_MAX.core };
  const exact  = keys.map(k => (maxes[k] / MAX_OTHERS) * remaining);
  const floors = exact.map(v => Math.floor(v));
  const deficit = remaining - floors.reduce((s, v) => s + v, 0);
  const rems   = exact.map((v, i) => ({ i, r: v - floors[i] }));
  rems.sort((a, b) => b.r - a.r);
  rems.slice(0, deficit).forEach(({ i }) => { floors[i]++; });
  return { cardio: floors[0], strength: floors[1], core: floors[2] };
}

interface GoalLookupProps {
  colIdx: number;
  ageGroup: string;
  gender: string;
  cardioType: string;
  strengthType: string;
  coreType: string;
  whtrScore: number;
}

export function GoalLookup({
  colIdx,
  ageGroup,
  gender,
  cardioType,
  strengthType,
  coreType,
  whtrScore,
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

  const remaining = selectedTier - whtrScore;
  const dist      = distributeRemaining(remaining);
  const impossible = dist === null;

  const cardioPts   = dist?.cardio   ?? 0;
  const strengthPts = dist?.strength ?? 0;
  const corePts     = dist?.core     ?? 0;
  const totalPts    = whtrScore + (cardioType === 'walk' ? 0 : cardioPts) + strengthPts + corePts;

  const cardioVal   = !impossible && cardioType !== 'walk' && getTable(TABLE_MAP[cardioType as keyof typeof TABLE_MAP])
    ? getValueForScore(getTable(TABLE_MAP[cardioType as keyof typeof TABLE_MAP])!, colIdx, cardioPts)
    : null;
  const strengthVal = !impossible && getTable(TABLE_MAP[strengthType as keyof typeof TABLE_MAP])
    ? getValueForScore(getTable(TABLE_MAP[strengthType as keyof typeof TABLE_MAP])!, colIdx, strengthPts)
    : null;
  const coreVal     = !impossible && getTable(TABLE_MAP[coreType as keyof typeof TABLE_MAP])
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

      {impossible && (
        <p className="goal-impossible-note">
          Your current WHtR score ({whtrScore} pts) is not enough to reach {selectedTier} —
          you need at least {selectedTier - MAX_OTHERS} pts from WHtR to make this tier possible.
        </p>
      )}

      <div className="goal-table">
        <div className="goal-header">
          <span>Event</span>
          <span>Need</span>
          <span>Points</span>
        </div>

        {/* WHtR — anchored to current score */}
        <div className="goal-row goal-row-anchor">
          <span className="goal-event">
            Waist-to-Height
            <span className="goal-anchor-badge">anchored</span>
          </span>
          <span className={`goal-val ${whtrScore > 0 ? 'highlight-good' : 'score-none'}`}>
            {whtrScore > 0 ? 'current score' : 'not entered'}
          </span>
          <span className="goal-pts">{whtrScore} pts</span>
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
              {impossible ? '—' : cardioVal != null
                ? `${getTable(TABLE_MAP[cardioType as keyof typeof TABLE_MAP])?.isLowerBetter ? '≤' : '≥'} ${formatValue(cardioVal, cardioType)}`
                : '—'}
            </span>
            <span className="goal-pts">{impossible ? '—' : `${cardioPts} pts`}</span>
          </div>
        )}

        {/* Strength */}
        <div className="goal-row">
          <span className="goal-event">{strengthLabel[strengthType] ?? strengthType}</span>
          <span className="goal-val highlight-good">
            {impossible ? '—' : strengthVal != null ? `≥ ${formatValue(strengthVal, strengthType)}` : '—'}
          </span>
          <span className="goal-pts">{impossible ? '—' : `${strengthPts} pts`}</span>
        </div>

        {/* Core */}
        <div className="goal-row">
          <span className="goal-event">{coreLabel[coreType] ?? coreType}</span>
          <span className="goal-val highlight-good">
            {impossible ? '—' : coreVal != null
              ? `${getTable(TABLE_MAP[coreType as keyof typeof TABLE_MAP])?.isLowerBetter ? '≤' : '≥'} ${formatValue(coreVal, coreType)}`
              : '—'}
          </span>
          <span className="goal-pts">{impossible ? '—' : `${corePts} pts`}</span>
        </div>

        {/* Total */}
        <div className="goal-total-row">
          <span></span>
          <span className="goal-total-label">Projected Total</span>
          <span className={`goal-total-pts ${!impossible && totalPts >= 75 ? 'highlight-min' : 'score-fail'}`}>
            {impossible ? 'N/A' : `${totalPts} pts`}
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
