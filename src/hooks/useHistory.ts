import { useState } from 'react';
import type { HistoryEntry } from '../types';

const STORAGE_KEY = 'pfra-history';

function load(): HistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function persist(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(load);

  const save = (entry: Omit<HistoryEntry, 'id' | 'savedAt'>) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: Date.now().toString(),
      savedAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    persist(updated);
  };

  const remove = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    persist(updated);
  };

  const clearAll = () => {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const importEntries = (incoming: HistoryEntry[]): { added: number; updated: number } => {
    const existingMap = new Map(entries.map(e => [e.id, e]));
    let added = 0;
    let updated = 0;

    incoming.forEach(entry => {
      if (existingMap.has(entry.id)) {
        existingMap.set(entry.id, entry);
        updated++;
      } else {
        existingMap.set(entry.id, entry);
        added++;
      }
    });

    const merged = Array.from(existingMap.values()).sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
    setEntries(merged);
    persist(merged);
    return { added, updated };
  };


  return { entries, save, remove, clearAll, importEntries };
}
