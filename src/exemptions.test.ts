import { describe, it, expect } from 'vitest';
import type { Exemptions } from './types';
import { DEFAULT_EXEMPTIONS } from './types';

// Helper representing App's scoring logic for unit testing
function calculateAssessment({
  exemptions = DEFAULT_EXEMPTIONS,
  cardioType = 'run',
  whtrScore = 20,
  cardioScore = 50,
  strengthScore = 15,
  coreScore = 15,
  walkPassed = true,
}: {
  exemptions?: Exemptions;
  cardioType?: string;
  whtrScore?: number;
  cardioScore?: number;
  strengthScore?: number;
  coreScore?: number;
  walkPassed?: boolean | null;
}) {
  const isAllExempt = exemptions.whtr && exemptions.cardio && exemptions.strength && exemptions.core;

  const cardioMax = exemptions.cardio || cardioType === 'walk' ? 0 : 50;
  const scoredMax =
    (exemptions.whtr ? 0 : 20) +
    cardioMax +
    (exemptions.strength ? 0 : 15) +
    (exemptions.core ? 0 : 15);

  const actualCardioScore = cardioType === 'walk' ? 0 : cardioScore;

  const earnedPts =
    (exemptions.whtr ? 0 : whtrScore) +
    (exemptions.cardio ? 0 : actualCardioScore) +
    (exemptions.strength ? 0 : strengthScore) +
    (exemptions.core ? 0 : coreScore);

  const isPassFailOnly = !isAllExempt && scoredMax === 0;

  const totalScore = scoredMax > 0
    ? Math.round(((earnedPts / scoredMax) * 100) * 10) / 10
    : 0;

  const cardioPass = exemptions.cardio
    ? true
    : cardioType === 'walk'
    ? (walkPassed === true)
    : cardioScore > 0;
  const strengthPass = exemptions.strength || strengthScore > 0;
  const corePass = exemptions.core || coreScore > 0;

  const isPass = isAllExempt
    ? false
    : isPassFailOnly
    ? (walkPassed === true)
    : (totalScore >= 75 && cardioPass && strengthPass && corePass);

  return { totalScore, scoredMax, earnedPts, isPassFailOnly, isAllExempt, isPass };
}

describe('Exemption Composite Scoring', () => {
  it('standard assessment with no exemptions scores out of 100', () => {
    const res = calculateAssessment({
      whtrScore: 20,
      cardioScore: 50,
      strengthScore: 15,
      coreScore: 15,
    });
    expect(res.scoredMax).toBe(100);
    expect(res.earnedPts).toBe(100);
    expect(res.totalScore).toBe(100);
    expect(res.isPass).toBe(true);
  });

  it('exempt from cardio (50 pts) rescales remaining 50 points to 100', () => {
    const res = calculateAssessment({
      exemptions: { ...DEFAULT_EXEMPTIONS, cardio: true },
      whtrScore: 20,
      strengthScore: 12,
      coreScore: 13,
    });
    // scoredMax = 20 + 0 + 15 + 15 = 50
    // earned = 20 + 12 + 13 = 45
    // score = 45 / 50 * 100 = 90.0
    expect(res.scoredMax).toBe(50);
    expect(res.earnedPts).toBe(45);
    expect(res.totalScore).toBe(90.0);
    expect(res.isPass).toBe(true);
  });

  it('exempt from WHtR (20 pts) rescales remaining 80 points to 100', () => {
    const res = calculateAssessment({
      exemptions: { ...DEFAULT_EXEMPTIONS, whtr: true },
      cardioScore: 40,
      strengthScore: 10,
      coreScore: 10,
    });
    // scoredMax = 50 + 15 + 15 = 80
    // earned = 40 + 10 + 10 = 60
    // score = 60 / 80 * 100 = 75.0
    expect(res.scoredMax).toBe(80);
    expect(res.earnedPts).toBe(60);
    expect(res.totalScore).toBe(75.0);
    expect(res.isPass).toBe(true);
  });

  it('multiple exemptions: exempt cardio and strength rescales from 35 points', () => {
    const res = calculateAssessment({
      exemptions: { ...DEFAULT_EXEMPTIONS, cardio: true, strength: true },
      whtrScore: 15,
      coreScore: 12,
    });
    // scoredMax = 20 + 15 = 35
    // earned = 15 + 12 = 27
    // score = 27 / 35 * 100 = 77.1
    expect(res.scoredMax).toBe(35);
    expect(res.earnedPts).toBe(27);
    expect(res.totalScore).toBe(77.1);
    expect(res.isPass).toBe(true);
  });

  it('walk test with exemptions: exempt WHtR and strength with Walk', () => {
    const res = calculateAssessment({
      exemptions: { ...DEFAULT_EXEMPTIONS, whtr: true, strength: true },
      cardioType: 'walk',
      walkPassed: true,
      coreScore: 13,
    });
    // scoredMax = core (15) = 15. Walk is 0 scored pts.
    // earned = 13
    // score = 13 / 15 * 100 = 86.7
    expect(res.scoredMax).toBe(15);
    expect(res.earnedPts).toBe(13);
    expect(res.totalScore).toBe(86.7);
    expect(res.isPass).toBe(true);
  });

  it('fails if walk did not pass even when composite score is high', () => {
    const res = calculateAssessment({
      exemptions: { ...DEFAULT_EXEMPTIONS, whtr: true, strength: true },
      cardioType: 'walk',
      walkPassed: false,
      coreScore: 15,
    });
    expect(res.totalScore).toBe(100);
    expect(res.isPass).toBe(false);
  });

  it('pass/fail only mode when all scored components are exempt and Walk remains', () => {
    const res = calculateAssessment({
      exemptions: { whtr: true, cardio: false, strength: true, core: true },
      cardioType: 'walk',
      walkPassed: true,
    });
    expect(res.scoredMax).toBe(0);
    expect(res.isPassFailOnly).toBe(true);
    expect(res.isAllExempt).toBe(false);
    expect(res.isPass).toBe(true);
  });

  it('pass/fail only fails if Walk fails', () => {
    const res = calculateAssessment({
      exemptions: { whtr: true, cardio: false, strength: true, core: true },
      cardioType: 'walk',
      walkPassed: false,
    });
    expect(res.isPassFailOnly).toBe(true);
    expect(res.isPass).toBe(false);
  });

  it('all 4 components exempt triggers isAllExempt and does not pass', () => {
    const res = calculateAssessment({
      exemptions: { whtr: true, cardio: true, strength: true, core: true },
    });
    expect(res.isAllExempt).toBe(true);
    expect(res.isPass).toBe(false);
    expect(res.totalScore).toBe(0);
  });
});
