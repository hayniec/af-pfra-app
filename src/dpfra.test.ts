import { describe, it, expect } from 'vitest';
import type { HistoryEntry } from './types';

describe('Diagnostic PFRA (DPFRA) AFMAN 36-2905 Section 3.8', () => {
  it('correctly handles official vs diagnostic assessment types', () => {
    const officialEntry: HistoryEntry = {
      id: '1',
      savedAt: new Date().toISOString(),
      assessmentType: 'official',
      ageGroup: '<25',
      gender: 'male',
      cardioType: 'run',
      cardioValue: 800,
      strengthType: 'pushup',
      strengthValue: 50,
      coreType: 'situp',
      coreValue: 50,
      whtrValue: 0.48,
      compositeScore: 92.5,
      passed: true,
      whtrScore: 20,
      cardioScore: 45,
      strengthScore: 14,
      coreScore: 13.5,
    };

    const diagnosticEntry: HistoryEntry = {
      ...officialEntry,
      id: '2',
      assessmentType: 'diagnostic',
      compositeScore: 78.0,
    };

    const entries = [officialEntry, diagnosticEntry];

    // Filter testing
    const officialOnly = entries.filter(e => (e.assessmentType ?? 'official') === 'official');
    const diagnosticOnly = entries.filter(e => e.assessmentType === 'diagnostic');

    expect(officialOnly).toHaveLength(1);
    expect(officialOnly[0].id).toBe('1');
    expect(diagnosticOnly).toHaveLength(1);
    expect(diagnosticOnly[0].id).toBe('2');
  });

  it('defaults missing assessmentType to official for backward compatibility', () => {
    const legacyEntry: Partial<HistoryEntry> = {
      id: 'legacy-1',
      compositeScore: 85,
    };

    const type = legacyEntry.assessmentType ?? 'official';
    expect(type).toBe('official');
  });
});
