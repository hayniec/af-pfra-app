import { useRef } from 'react';
import type { HistoryEntry } from '../types';
import { formatValue } from '../scoring';

interface ScoreHistoryProps {
  entries: HistoryEntry[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onImport: (entries: HistoryEntry[]) => void;
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
    // Human-readable columns (for spreadsheets)
    'Date', 'Time', 'Gender', 'Age Group',
    'Composite Score', 'Result',
    'WHtR Score', 'Cardio Type', 'Cardio Score',
    'Strength Type', 'Strength Score', 'Core Type', 'Core Score',
    // Raw columns (prefixed with _ — used for re-import)
    '_id', '_savedAt', '_gender', '_ageGroup',
    '_cardioType', '_cardioValue', '_whtrValue',
    '_strengthType', '_strengthValue',
    '_coreType', '_coreValue',
    '_compositeScore', '_passed',
    '_whtrScore', '_cardioScore', '_strengthScore', '_coreScore',
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
    // Raw data
    e.id, e.savedAt, e.gender, e.ageGroup,
    e.cardioType, e.cardioValue, e.whtrValue,
    e.strengthType, e.strengthValue,
    e.coreType, e.coreValue,
    e.compositeScore, e.passed ? '1' : '0',
    e.whtrScore, e.cardioScore, e.strengthScore, e.coreScore,
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

function parseCSV(text: string): HistoryEntry[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse a single quoted CSV cell
  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        let val = '';
        i++; // skip opening quote
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') { val += '"'; i += 2; }
          else if (line[i] === '"') { i++; break; }
          else { val += line[i++]; }
        }
        cells.push(val);
        if (line[i] === ',') i++;
      } else {
        const end = line.indexOf(',', i);
        cells.push(end === -1 ? line.slice(i) : line.slice(i, end));
        i = end === -1 ? line.length : end + 1;
      }
    }
    return cells;
  };

  const headers = parseRow(lines[0]);
  const col = (name: string) => headers.indexOf(name);

  // Must have raw columns to import
  if (col('_id') === -1 || col('_savedAt') === -1) return [];

  const entries: HistoryEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseRow(lines[i]);
    if (cells.length < headers.length) continue;
    const get = (name: string) => cells[col(name)] ?? '';
    try {
      entries.push({
        id:             get('_id') || Date.now().toString() + i,
        savedAt:        get('_savedAt'),
        gender:         get('_gender'),
        ageGroup:       get('_ageGroup'),
        cardioType:     get('_cardioType'),
        cardioValue:    Number(get('_cardioValue')),
        whtrValue:      Number(get('_whtrValue')),
        strengthType:   get('_strengthType'),
        strengthValue:  Number(get('_strengthValue')),
        coreType:       get('_coreType'),
        coreValue:      Number(get('_coreValue')),
        compositeScore: Number(get('_compositeScore')),
        passed:         get('_passed') === '1',
        whtrScore:      Number(get('_whtrScore')),
        cardioScore:    Number(get('_cardioScore')),
        strengthScore:  Number(get('_strengthScore')),
        coreScore:      Number(get('_coreScore')),
      });
    } catch {
      // skip malformed rows
    }
  }
  return entries;
}

export function ScoreHistory({ entries, onRemove, onClearAll, onImport }: ScoreHistoryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const imported = parseCSV(text);
      if (imported.length > 0) {
        onImport(imported);
      } else {
        alert('No valid entries found. Make sure you are importing a CSV exported from this app.');
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-selected if needed
    e.target.value = '';
  };

  return (
    <section className="history-section">
      <div className="history-header">
        <h2 className="section-title">Score History</h2>
        <div className="history-actions">
          <button className="history-import-btn" onClick={() => fileInputRef.current?.click()}>
            Import CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          {entries.length > 0 && (
            <button className="history-export-btn" onClick={() => exportCSV(entries)}>
              Export CSV
            </button>
          )}
          {entries.length > 1 && (
            <button className="history-clear-btn" onClick={onClearAll}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="history-empty">No saved results yet. Complete your assessment and click "Save Results" to track your progress.</p>
      ) : (
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
      )}
    </section>
  );
}
