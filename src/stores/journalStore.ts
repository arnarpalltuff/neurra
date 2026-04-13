import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Brain journal — emotional log of how training felt.
 *
 * Distinct from `userStore.mood` (which is the daily 5-state mood for the
 * home check-in). Journal uses a simpler 3-state thumbs scale and supports
 * an optional 140-char note attached to a specific session.
 *
 * Persisted, capped at 365 entries (one year of training).
 */

export type JournalMood = 'up' | 'neutral' | 'down';

export interface JournalEntry {
  /** Unique id (timestamp-based). */
  id: string;
  /** ISO date string YYYY-MM-DD. */
  date: string;
  /** Unix ms — for sorting and "today" detection. */
  timestamp: number;
  mood: JournalMood;
  /** Optional reflection, max 140 chars. */
  note?: string;
  /** The session's best game score for context. */
  topScore?: number;
  /** Name of the game with the best score (display only). */
  bestGameName?: string;
}

interface JournalState {
  entries: JournalEntry[];
  addEntry: (entry: Omit<JournalEntry, 'id' | 'date' | 'timestamp'>) => void;
  /** Has the user logged a journal entry today? */
  hasEntryToday: () => boolean;
  /** Most recent N entries, newest first. */
  recent: (limit?: number) => JournalEntry[];
  clearAll: () => void;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) => {
        const now = Date.now();
        const newEntry: JournalEntry = {
          ...entry,
          id: `j-${now}`,
          date: todayStr(),
          timestamp: now,
          // Defensively trim notes.
          note: entry.note ? entry.note.slice(0, 140).trim() || undefined : undefined,
        };
        set((state) => ({
          entries: [...state.entries, newEntry].slice(-365),
        }));
      },

      hasEntryToday: () => {
        const today = todayStr();
        return get().entries.some((e) => e.date === today);
      },

      recent: (limit = 30) => {
        return [...get().entries].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
      },

      clearAll: () => set({ entries: [] }),
    }),
    {
      name: 'neurra-journal-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ entries: state.entries }),
    },
  ),
);
