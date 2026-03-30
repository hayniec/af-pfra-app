import type { HistoryEntry } from '../types';
import { formatValue } from '../scoring';

interface ScoreHistoryProps {
  entries: HistoryEntry[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

const EVENT_LABELS: Record<string, string> = {
  run: 'Run', hamr: 'HAMR', walk: 'Walk',
  pushup: 'Push-ups', handrelease: 'HR Push-ups',
  situp: 'Sit-ups', crunches: 'Crunches', plank: 'Plank',
};

function exportCSV(entries: HistoryEntry[]) {
  const headers = [
    'Date', 'Time', 'Gender', 'Age Group',
    'Composite Score', 'Result',
    'WHtR Score',
    'Cardio Type', 'Cardio Score',
    'Strength Type', 'Strength Score',
    'Core Type', 'Core Score',
  ];

  const rows = entries.map(e => [
    formatDate(e.savedAt),
    formatTime(e.savedAt),
    e.gender === 'male' ? 'Male' : 'Female',
    e.ageGroup === '<25' ? 'Under 25' : e.ageGroup,
    e.compositeScore,
    e.passed ? 'Pass' : 'Fail',
    e.whtrScore.toFixed(1),
    EVENT_LABELS[e.cardioType] ?? e.cardioType,
    e.cardioType === 'walk' ? formatValue(e.cardioValue, 'walk') : e.cardioScore.toFixed(1),
    EVENT_LABELS[e.strengthType] ?? e.strengthType,
    e.strengthScore.toFixed(1),
    EVENT_LABELS[e.coreType] ?? e.coreType,
    e.coreScore.toFixed(1),
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `pfra-scores-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ScoreHistory({ entries, onRemove, onClearAll }: ScoreHistoryProps) {
  if (entries.length === 0) {
    return (
      <section className="history-section">
        <h2 className="section-title">Score History</h2>
        <p className="history-empty">No saved results yet. Complete your assessment and click "Save Results" to track your progress.</p>
      </section>
    );
  }

  return (
    <section className="history-section">
      <div className="history-header">
        <h2 className="section-title">Score History</h2>
        <div className="history-actions">
          <button className="history-export-btn" onClick={() => exportCSV(entries)}>
            Export CSV
          </button>
          {entries.length > 1 && (
            <button className="history-clear-btn" onClick={onClearAll}>
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="history-list">
        {entries.map((entry, idx) => {
          const isLatest = idx === 0;
          const prev = entries[idx + 1];
          const delta = prev ? entry.compositeScore - prev.compositeScore : null;

          return (
            <div key={entry.id} className={`history-entry ${entry.passed ? 'entry-pass' : 'entry-fail'}`}>
              <div className="history-entry-top">
                <div className="history-meta">
                  <span className="history-date">{formatDate(entry.savedAt)}</span>
                  <span className="history-time">{formatTime(entry.savedAt)}</span>
                  {isLatest && <span className="history-latest-badge">Latest</span>}
                </div>
                <button
                  className="history-delete-btn"
                  onClick={() => onRemove(entry.id)}
                  aria-label="Delete entry"
                >
                  ✕
                </button>
              </div>

              <div className="history-score-row">
                <div className="history-score">
                  <span className="history-score-num">{entry.compositeScore}</span>
                  <span className="history-score-label">pts</span>
                </div>
                <span className={`history-pass-badge ${entry.passed ? 'badge-pass' : 'badge-fail'}`}>
                  {entry.passed ? 'PASS' : 'FAIL'}
                </span>
                {delta !== null && (
                  <span className={`history-delta ${delta > 0 ? 'delta-up' : delta < 0 ? 'delta-down' : 'delta-neutral'}`}>
                    {delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '—'}
                  </span>
                )}
              </div>

              <div className="history-breakdown">
                <span className="history-stat">WHtR {entry.whtrScore.toFixed(0)}</span>
                <span className="history-sep">·</span>
                <span className="history-stat">
                  {EVENT_LABELS[entry.cardioType] ?? entry.cardioType}{' '}
                  {entry.cardioType === 'walk'
                    ? formatValue(entry.cardioValue, 'walk')
                    : entry.cardioScore.toFixed(0) + ' pts'}
                </span>
                <span className="history-sep">·</span>
                <span className="history-stat">
                  {EVENT_LABELS[entry.strengthType] ?? entry.strengthType} {entry.strengthScore.toFixed(0)}
                </span>
                <span className="history-sep">·</span>
                <span className="history-stat">
                  {EVENT_LABELS[entry.coreType] ?? entry.coreType} {entry.coreScore.toFixed(0)}
                </span>
              </div>

              <div className="history-profile">
                {entry.gender === 'male' ? 'Male' : 'Female'} · {entry.ageGroup === '<25' ? 'Under 25' : entry.ageGroup}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
