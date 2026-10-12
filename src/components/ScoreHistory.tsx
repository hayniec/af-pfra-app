import { useRef, useState } from 'react';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import type { HistoryEntry, Exemptions } from '../types';
import { DEFAULT_EXEMPTIONS } from '../types';
import { formatValue } from '../scoring';

interface ScoreHistoryProps {
  entries: HistoryEntry[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onImport: (entries: HistoryEntry[]) => { added: number; updated: number } | void;
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

function fallbackDownload(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportCSV(entries: HistoryEntry[]) {
  const headers = [
    // Human-readable columns (for spreadsheets)
    'Date', 'Time', 'Type', 'Gender', 'Age Group',
    'Composite Score', 'Result',
    'WHtR Score', 'Cardio Type', 'Cardio Score',
    'Strength Type', 'Strength Score', 'Core Type', 'Core Score',
    // Raw columns (prefixed with _ — used for re-import)
    '_id', '_savedAt', '_assessmentType', '_gender', '_ageGroup',
    '_cardioType', '_cardioValue', '_whtrValue',
    '_strengthType', '_strengthValue',
    '_coreType', '_coreValue',
    '_compositeScore', '_passed',
    '_whtrScore', '_cardioScore', '_strengthScore', '_coreScore',
    '_exemptWhtr', '_exemptCardio', '_exemptStrength', '_exemptCore',
  ];

  const rows = entries.map(e => [
    formatDate(e.savedAt),
    formatTime(e.savedAt),
    e.assessmentType === 'diagnostic' ? 'Diagnostic' : 'Official',
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
    e.id, e.savedAt, e.assessmentType ?? 'official', e.gender, e.ageGroup,
    e.cardioType, e.cardioValue, e.whtrValue,
    e.strengthType, e.strengthValue,
    e.coreType, e.coreValue,
    e.compositeScore, e.passed ? '1' : '0',
    e.whtrScore, e.cardioScore, e.strengthScore, e.coreScore,
    (e.exemptions?.whtr ? '1' : '0'),
    (e.exemptions?.cardio ? '1' : '0'),
    (e.exemptions?.strength ? '1' : '0'),
    (e.exemptions?.core ? '1' : '0'),
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const filename = `pfra-scores-${new Date().toISOString().slice(0, 10)}.csv`;

  // Use Capacitor Native Share if on Android/iOS
  if (Capacitor.isNativePlatform()) {
    try {
      // Write file to cache directory so it can be shared
      const result = await Filesystem.writeFile({
        path: filename,
        data: csv,
        directory: Directory.Cache,
        encoding: 'utf8' as any
      });

      await Share.share({
        title: 'PFRA Scores Export',
        text: 'Air Force PFRA Calculator Score History',
        url: result.uri,
      });
      return;
    } catch (e) {
      console.error('Native Share failed', e);
      // Fall through to standard web fallback
    }
  }

  // Web fallback (for browser/testing)
  fallbackDownload(csv, filename);
}

export function parseCSV(text: string): HistoryEntry[] {
  if (!text || typeof text !== 'string') return [];
  // Strip UTF-8 BOM, normalize Windows and Mac line endings (\r\n and \r to \n)
  const clean = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = clean.trim().split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Detect delimiter (, or ;)
  const firstLine = lines[0] ?? '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semiCount > commaCount ? ';' : ',';

  // Parse a single CSV line respecting quotes
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
        cells.push(val.trim());
        if (line[i] === delimiter) i++;
      } else {
        const end = line.indexOf(delimiter, i);
        const val = end === -1 ? line.slice(i) : line.slice(i, end);
        cells.push(val.trim());
        i = end === -1 ? line.length : end + 1;
      }
    }
    if (line.endsWith(delimiter)) {
      cells.push('');
    }
    return cells;
  };

  const headers = parseRow(lines[0] ?? '').map(h => h.trim().toLowerCase());
  const col = (name: string) => headers.indexOf(name.toLowerCase());

  // Check if either raw columns or human-readable columns exist
  const hasRaw = col('_id') !== -1 || col('_savedat') !== -1 || col('_compositescore') !== -1;
  const hasHuman = col('composite score') !== -1 || col('date') !== -1;
  if (!hasRaw && !hasHuman) return [];

  const entries: HistoryEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cells = parseRow(line);
    if (cells.length < 3) continue;
    const get = (name: string): string => {
      const idx = col(name);
      return idx !== -1 && idx < cells.length ? (cells[idx] ?? '') : '';
    };

    try {
      const exWhtr = get('_exemptwhtr') === '1' || get('whtr score')?.toLowerCase() === 'ex';
      const exCardio = get('_exemptcardio') === '1' || get('cardio score')?.toLowerCase() === 'ex';
      const exStrength = get('_exemptstrength') === '1' || get('strength score')?.toLowerCase() === 'ex';
      const exCore = get('_exemptcore') === '1' || get('core score')?.toLowerCase() === 'ex';

      const exemptions: Exemptions = {
        whtr: exWhtr,
        cardio: exCardio,
        strength: exStrength,
        core: exCore,
      };

      const rawAssessmentType = (get('_assessmenttype') || get('type')).toLowerCase();
      const assessmentType: 'official' | 'diagnostic' = rawAssessmentType.includes('diag') ? 'diagnostic' : 'official';

      const rawGender = (get('_gender') || get('gender') || 'male').toLowerCase();
      const gender = rawGender.includes('female') ? 'female' : 'male';

      const ageGroup = get('_agegroup') || get('age group') || '<25';

      let cardioType = get('_cardiotype') || get('cardio type') || 'run';
      const cardioTypeLower = cardioType.toLowerCase();
      if (cardioTypeLower.includes('hamr')) cardioType = 'hamr';
      else if (cardioTypeLower.includes('walk')) cardioType = 'walk';
      else if (cardioTypeLower.includes('run')) cardioType = 'run';

      let strengthType = get('_strengthtype') || get('strength type') || 'pushup';
      const strengthTypeLower = strengthType.toLowerCase();
      if (strengthTypeLower.includes('hand') || strengthTypeLower.includes('hr')) strengthType = 'handrelease';
      else if (strengthTypeLower.includes('push')) strengthType = 'pushup';

      let coreType = get('_coretype') || get('core type') || 'situp';
      const coreTypeLower = coreType.toLowerCase();
      if (coreTypeLower.includes('plank')) coreType = 'plank';
      else if (coreTypeLower.includes('crunch')) coreType = 'crunches';
      else if (coreTypeLower.includes('sit')) coreType = 'situp';

      const compositeScore = Number(get('_compositescore') || get('composite score')) || 0;
      const passed = get('_passed') === '1' || get('result')?.toLowerCase().includes('pass') || compositeScore >= 75;

      const rawSavedAt = get('_savedat');
      let savedAt = new Date().toISOString();
      if (rawSavedAt && !isNaN(Date.parse(rawSavedAt))) {
        savedAt = new Date(rawSavedAt).toISOString();
      } else if (get('date')) {
        const dateStr = get('date') + (get('time') ? ' ' + get('time') : '');
        if (!isNaN(Date.parse(dateStr))) {
          savedAt = new Date(dateStr).toISOString();
        }
      }

      entries.push({
        id:             get('_id') || `import-${Date.now()}-${i}`,
        savedAt,
        assessmentType,
        gender,
        ageGroup,
        cardioType,
        cardioValue:    Number(get('_cardiovalue')) || Number(get('cardio score')) || 0,
        whtrValue:      Number(get('_whtrvalue')) || 0.50,
        strengthType,
        strengthValue:  Number(get('_strengthvalue')) || Number(get('strength score')) || 0,
        coreType,
        coreValue:      Number(get('_corevalue')) || Number(get('core score')) || 0,
        compositeScore,
        passed,
        whtrScore:      Number(get('_whtrscore')) || (exWhtr ? 0 : Number(get('whtr score')) || 0),
        cardioScore:    Number(get('_cardioscore')) || (exCardio ? 0 : Number(get('cardio score')) || 0),
        strengthScore:  Number(get('_strengthscore')) || (exStrength ? 0 : Number(get('strength score')) || 0),
        coreScore:      Number(get('_corescore')) || (exCore ? 0 : Number(get('core score')) || 0),
        exemptions,
      });
    } catch {
      // skip malformed rows
    }
  }
  return entries;
}

export function ScoreHistory({ entries, onRemove, onClearAll, onImport }: ScoreHistoryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<'all' | 'official' | 'diagnostic'>('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const officialCount = entries.filter(e => (e.assessmentType ?? 'official') === 'official').length;
  const diagnosticCount = entries.filter(e => e.assessmentType === 'diagnostic').length;

  const filteredEntries = entries.filter(e => {
    if (filter === 'official') return (e.assessmentType ?? 'official') === 'official';
    if (filter === 'diagnostic') return e.assessmentType === 'diagnostic';
    return true;
  });

  const processImportText = (text: string) => {
    setErrorMessage(null);
    try {
      const imported = parseCSV(text);
      if (imported.length > 0) {
        const res = onImport(imported);
        setIsImportModalOpen(false);
        setPasteText('');
        if (res && 'added' in res && (res.added > 0 || res.updated > 0)) {
          alert(`Import successful! ${res.added} new and ${res.updated} existing record(s) processed.`);
        } else {
          alert(`Successfully imported ${imported.length} assessment record(s)!`);
        }
      } else {
        setErrorMessage('No valid assessment records found. Please ensure the CSV contains exported PFRA columns.');
      }
    } catch (err) {
      console.error('Import parse error:', err);
      setErrorMessage('Failed to parse CSV data. Please ensure it is a valid PFRA CSV export.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      processImportText(text);
    };
    reader.onerror = () => {
      setErrorMessage('Unable to read the file directly from Google Drive. Please open the Google Drive app, tap the three dots (⋮), select "Download", and import it from your Downloads folder.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <section className="history-section">
      <div className="history-header">
        <h2 className="section-title">Score History</h2>
        <div className="history-actions">
          <button
            type="button"
            className="history-import-btn"
            onClick={() => {
              setErrorMessage(null);
              setPasteText('');
              setIsImportModalOpen(true);
            }}
          >
            Import CSV
          </button>

          {entries.length > 0 && (
            <button type="button" className="history-export-btn" onClick={() => exportCSV(entries)}>
              Export CSV
            </button>
          )}
          {entries.length > 1 && (
            <button type="button" className="history-clear-btn" onClick={onClearAll}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {isImportModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsImportModalOpen(false)} role="presentation">
          <div
            className="modal-content card animate-fade-in"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-history-title"
          >
            <div className="modal-header">
              <h3 id="import-history-title" className="section-title">
                Import Score History
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsImportModalOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {errorMessage && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fca5a5',
                  fontSize: '0.85rem'
                }}>
                  {errorMessage}
                </div>
              )}

              {/* Option 1: File selection */}
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>
                  Option 1: Select CSV File
                </label>
                <label
                  className="history-import-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    width: '100%',
                    padding: '12px',
                    fontSize: '0.95rem'
                  }}
                >
                  <span>📁 Choose File (Drive, Files, Storage)</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv,text/comma-separated-values,text/plain,application/csv,application/x-csv,application/vnd.ms-excel,application/octet-stream,*/*"
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                    onChange={handleFileChange}
                  />
                </label>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Compatible with Google Drive, Files app, Downloads, and internal storage.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
                <span style={{ padding: '0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
              </div>

              {/* Option 2: Paste CSV Text */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Option 2: Paste CSV Data
                  </label>
                  {typeof navigator !== 'undefined' && navigator.clipboard && (
                    <button
                      type="button"
                      className="history-import-btn"
                      style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text) {
                            setPasteText(text);
                            processImportText(text);
                          }
                        } catch {
                          setErrorMessage('Clipboard permission denied. Please paste manually into the text box below.');
                        }
                      }}
                    >
                      📋 Paste Clipboard
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder='Paste your backup CSV text here (e.g. "Date","Time",...)'
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
                {pasteText.trim().length > 0 && (
                  <button
                    type="button"
                    className="history-import-btn"
                    style={{ width: '100%', marginTop: '8px', padding: '10px' }}
                    onClick={() => processImportText(pasteText)}
                  >
                    Process & Import Pasted Data
                  </button>
                )}
              </div>

              {/* Tip for Google Drive users */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.8rem',
                color: '#93c5fd',
                lineHeight: '1.4'
              }}>
                <strong>💡 Google Drive Tip:</strong> If Google Drive grays out or delays streaming the file, open your Google Drive app, tap the three dots (⋮) on the file, select <strong>Download</strong> to save it to your device's Downloads folder, and then choose it with Option 1 above.
              </div>
            </div>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className="history-filter-tabs">
          <button
            type="button"
            className={`history-filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({entries.length})
          </button>
          <button
            type="button"
            className={`history-filter-tab ${filter === 'official' ? 'active' : ''}`}
            onClick={() => setFilter('official')}
          >
            Official ({officialCount})
          </button>
          <button
            type="button"
            className={`history-filter-tab ${filter === 'diagnostic' ? 'active' : ''}`}
            onClick={() => setFilter('diagnostic')}
          >
            Diagnostic ({diagnosticCount})
          </button>
        </div>
      )}

      {filteredEntries.length === 0 ? (
        <p className="history-empty">
          {entries.length === 0
            ? 'No saved results yet. Complete your assessment and click "Save Results" to track your progress.'
            : `No ${filter} assessments found.`}
        </p>
      ) : (
        <div className="history-list">
          {filteredEntries.map((entry, idx) => {
            const isLatest = idx === 0 && filter === 'all';
            const prev = filteredEntries[idx + 1];
            const delta = prev ? entry.compositeScore - prev.compositeScore : null;

            const ex = entry.exemptions ?? DEFAULT_EXEMPTIONS;
            const isDiagnostic = entry.assessmentType === 'diagnostic';

            return (
              <div key={entry.id} className={`history-entry ${entry.passed ? 'entry-pass' : 'entry-fail'}`}>
                <div className="history-entry-top">
                  <div className="history-meta">
                    <span className="history-date">{formatDate(entry.savedAt)}</span>
                    <span className="history-time">{formatTime(entry.savedAt)}</span>
                    <span className={`history-type-badge ${isDiagnostic ? 'badge-diagnostic' : 'badge-official'}`}>
                      {isDiagnostic ? 'DIAGNOSTIC' : 'OFFICIAL'}
                    </span>
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
                  <span className="history-stat">
                    WHtR {ex.whtr ? <span className="history-exempt-badge">EX</span> : entry.whtrScore.toFixed(0)}
                  </span>
                  <span className="history-sep">·</span>
                  <span className="history-stat">
                    {EVENT_LABELS[entry.cardioType] ?? entry.cardioType}{' '}
                    {ex.cardio
                      ? <span className="history-exempt-badge">EX</span>
                      : entry.cardioType === 'walk'
                        ? formatValue(entry.cardioValue, 'walk')
                        : entry.cardioScore.toFixed(0) + ' pts'}
                  </span>
                  <span className="history-sep">·</span>
                  <span className="history-stat">
                    {EVENT_LABELS[entry.strengthType] ?? entry.strengthType}{' '}
                    {ex.strength ? <span className="history-exempt-badge">EX</span> : entry.strengthScore.toFixed(0)}
                  </span>
                  <span className="history-sep">·</span>
                  <span className="history-stat">
                    {EVENT_LABELS[entry.coreType] ?? entry.coreType}{' '}
                    {ex.core ? <span className="history-exempt-badge">EX</span> : entry.coreScore.toFixed(0)}
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
