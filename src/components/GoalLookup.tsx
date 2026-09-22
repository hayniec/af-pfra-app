import { useState } from 'react';
import rawScoringData from '../scoringData.json';
import type { ScoringTable, Exemptions } from '../types';
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

const COMPONENT_MAX = { whtr: 20, cardio: 50, strength: 15, core: 15 } as const;

/**
 * Distributes `remaining` points across the given non-exempt scored components
 * proportionally, using the largest-remainder method so parts sum exactly to
 * `remaining`. Returns null if remaining exceeds what the available components
 * can provide.
 */
function distributeRemaining(
  remaining: number,
  available: { key: string; max: number }[],
): Record<string, number> | null {
  const totalMax = available.reduce((s, a) => s + a.max, 0);
  if (remaining > totalMax) return null;
  if (remaining <= 0) {
    const result: Record<string, number> = {};
    available.forEach(a => { result[a.key] = 0; });
    return result;
  }

  const exact  = available.map(a => (a.max / totalMax) * remaining);
  const floors = exact.map(v => Math.floor(v));
  const deficit = remaining - floors.reduce((s, v) => s + v, 0);
  const rems   = exact.map((v, i) => ({ i, r: v - floors[i] }));
  rems.sort((a, b) => b.r - a.r);
  rems.slice(0, deficit).forEach(({ i }) => { floors[i]++; });

  const result: Record<string, number> = {};
  available.forEach((a, i) => { result[a.key] = floors[i]; });
  return result;
}

interface GoalLookupProps {
  colIdx: number;
  ageGroup: string;
  gender: string;
  cardioType: string;
  strengthType: string;
  coreType: string;
  whtrScore: number;
  exemptions: Exemptions;
}

export function GoalLookup({
  colIdx,
  ageGroup,
  gender,
  cardioType,
  strengthType,
  coreType,
  whtrScore,
  exemptions,
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

  // Build list of non-exempt scored components for distribution
  // WHtR is anchored (uses current score), so it's never distributed — only subtracted
  // Walk contributes 0 scored points, so if cardio is Walk it acts like an exempt from scoring
  const whtrContribution = exemptions.whtr ? 0 : whtrScore;

  const available: { key: string; max: number }[] = [];
  if (!exemptions.cardio && cardioType !== 'walk') {
    available.push({ key: 'cardio', max: COMPONENT_MAX.cardio });
  }
  if (!exemptions.strength) {
    available.push({ key: 'strength', max: COMPONENT_MAX.strength });
  }
  if (!exemptions.core) {
    available.push({ key: 'core', max: COMPONENT_MAX.core });
  }

  const totalScoredMax = (exemptions.whtr ? 0 : COMPONENT_MAX.whtr) +
    available.reduce((s, a) => s + a.max, 0);

  // The target raw points needed from the distributable components
  // (selectedTier is a percentage, so target raw = selectedTier/100 * totalScoredMax)
  const targetRaw = Math.ceil((selectedTier / 100) * totalScoredMax);
  const remaining = targetRaw - whtrContribution;

  const dist = available.length > 0 ? distributeRemaining(remaining, available) : null;
  const impossible = dist === null || (available.length === 0 && remaining > 0);

  const cardioPts   = dist?.cardio   ?? 0;
  const strengthPts = dist?.strength ?? 0;
  const corePts     = dist?.core     ?? 0;
  const earnedProjected = whtrContribution + cardioPts + strengthPts + corePts;
  const projectedScore = totalScoredMax > 0
    ? Math.round((earnedProjected / totalScoredMax) * 100)
    : 0;

  const cardioVal   = !impossible && !exemptions.cardio && cardioType !== 'walk' && getTable(TABLE_MAP[cardioType as keyof typeof TABLE_MAP])
    ? getValueForScore(getTable(TABLE_MAP[cardioType as keyof typeof TABLE_MAP])!, colIdx, cardioPts)
    : null;
  const strengthVal = !impossible && !exemptions.strength && getTable(TABLE_MAP[strengthType as keyof typeof TABLE_MAP])
    ? getValueForScore(getTable(TABLE_MAP[strengthType as keyof typeof TABLE_MAP])!, colIdx, strengthPts)
    : null;
  const coreVal     = !impossible && !exemptions.core && getTable(TABLE_MAP[coreType as keyof typeof TABLE_MAP])
    ? getValueForScore(getTable(TABLE_MAP[coreType as keyof typeof TABLE_MAP])!, colIdx, corePts)
    : null;

  const walkThreshold = cardioType === 'walk' && !exemptions.cardio ? getWalkThreshold(ageGroup, gender) : null;

  const allExempt = exemptions.whtr && exemptions.cardio && exemptions.strength && exemptions.core;

  if (allExempt) {
    return (
      <section className="goal-lookup">
        <h2 className="section-title">What Do I Need?</h2>
        <p className="all-exempt-warning">All components are exempt — no assessment to score.</p>
      </section>
    );
  }

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
          Your current scores are not enough to reach {selectedTier} with the available components.
        </p>
      )}

      <div className="goal-table">
        <div className="goal-header">
          <span>Event</span>
          <span>Need</span>
          <span>Points</span>
        </div>

        {/* WHtR */}
        {exemptions.whtr ? (
          <div className="goal-row">
            <span className="goal-event">WHtR</span>
            <span className="goal-val" style={{ color: 'var(--af-gold)' }}>EXEMPT</span>
            <span className="goal-pts">—</span>
          </div>
        ) : (
          <div className="goal-row goal-row-anchor">
            <span className="goal-event">
              WHtR
              <span className="goal-anchor-badge" style={{ padding: '0.1rem 0.2rem', marginLeft: '4px' }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ verticalAlign: 'middle' }}
                >
                  <path d="M12 22V8"/>
                  <path d="M5 12H2a10 10 0 0 0 20 0h-3"/>
                  <circle cx="12" cy="5" r="3"/>
                </svg>
              </span>
            </span>
            <span className={`goal-val ${whtrScore > 0 ? 'highlight-good' : 'score-none'}`}>
              {whtrScore > 0 ? 'current score' : 'not entered'}
            </span>
            <span className="goal-pts">{whtrScore} pts</span>
          </div>
        )}

        {/* Cardio */}
        {exemptions.cardio ? (
          <div className="goal-row">
            <span className="goal-event">{cardioLabel[cardioType] ?? 'Cardio'}</span>
            <span className="goal-val" style={{ color: 'var(--af-gold)' }}>EXEMPT</span>
            <span className="goal-pts">—</span>
          </div>
        ) : cardioType === 'walk' ? (
          <div className="goal-row">
            <span className="goal-event">{cardioLabel[cardioType]}</span>
            <span className="goal-val highlight-min">
              {walkThreshold != null ? `\u2264 ${formatValue(walkThreshold, 'walk')}` : '\u2014'}
            </span>
            <span className="goal-pts goal-pass-required">Must PASS</span>
          </div>
        ) : (
          <div className="goal-row">
            <span className="goal-event">{cardioLabel[cardioType] ?? cardioType}</span>
            <span className="goal-val highlight-good">
              {impossible ? '\u2014' : cardioVal != null
                ? `${getTable(TABLE_MAP[cardioType as keyof typeof TABLE_MAP])?.isLowerBetter ? '\u2264' : '\u2265'} ${formatValue(cardioVal, cardioType)}`
                : '\u2014'}
            </span>
            <span className="goal-pts">{impossible ? '\u2014' : `${cardioPts} pts`}</span>
          </div>
        )}

        {/* Strength */}
        {exemptions.strength ? (
          <div className="goal-row">
            <span className="goal-event">{strengthLabel[strengthType] ?? strengthType}</span>
            <span className="goal-val" style={{ color: 'var(--af-gold)' }}>EXEMPT</span>
            <span className="goal-pts">—</span>
          </div>
        ) : (
          <div className="goal-row">
            <span className="goal-event">{strengthLabel[strengthType] ?? strengthType}</span>
            <span className="goal-val highlight-good">
              {impossible ? '\u2014' : strengthVal != null ? `\u2265 ${formatValue(strengthVal, strengthType)}` : '\u2014'}
            </span>
            <span className="goal-pts">{impossible ? '\u2014' : `${strengthPts} pts`}</span>
          </div>
        )}

        {/* Core */}
        {exemptions.core ? (
          <div className="goal-row">
            <span className="goal-event">{coreLabel[coreType] ?? coreType}</span>
            <span className="goal-val" style={{ color: 'var(--af-gold)' }}>EXEMPT</span>
            <span className="goal-pts">—</span>
          </div>
        ) : (
          <div className="goal-row">
            <span className="goal-event">{coreLabel[coreType] ?? coreType}</span>
            <span className="goal-val highlight-good">
              {impossible ? '\u2014' : coreVal != null
                ? `${getTable(TABLE_MAP[coreType as keyof typeof TABLE_MAP])?.isLowerBetter ? '\u2264' : '\u2265'} ${formatValue(coreVal, coreType)}`
                : '\u2014'}
            </span>
            <span className="goal-pts">{impossible ? '\u2014' : `${corePts} pts`}</span>
          </div>
        )}

        {/* Total */}
        <div className="goal-total-row">
          <span className="goal-total-label">Projected Total</span>
          <span className={`goal-total-pts ${!impossible && projectedScore >= 75 ? 'highlight-min' : 'score-fail'}`}>
            {impossible ? 'N/A' : `${projectedScore} pts (rescaled)`}
          </span>
        </div>
      </div>

      {cardioType === 'walk' && !exemptions.cardio && (
        <p className="goal-walk-note">
          Walk is pass/fail — your total score is based on the other scored events.
        </p>
      )}
    </section>
  );
}
