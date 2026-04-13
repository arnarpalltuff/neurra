import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BRAIN_FACTS, BrainFact } from '../constants/brainFacts';

/**
 * Daily brain fact tracker.
 *
 * Shown as a small card on the home screen. Logic:
 *  - Pick a fact based on day-of-year modulo BRAIN_FACTS.length.
 *  - If that fact was shown in the last 30 days, walk forward until we find
 *    one that wasn't.
 *  - Record the date it was shown.
 *
 * Persists shown history (capped at 60 entries to keep storage small).
 */

interface ShownEntry {
  id: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
}

interface FactState {
  shownHistory: ShownEntry[];
  /** Get today's fact, recording it if not already recorded for today. */
  getTodaysFact: () => BrainFact;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function daysBetween(a: string, b: string): number {
  const ad = new Date(a).getTime();
  const bd = new Date(b).getTime();
  return Math.abs(Math.floor((bd - ad) / (1000 * 60 * 60 * 24)));
}

export const useFactStore = create<FactState>()(
  persist(
    (set, get) => ({
      shownHistory: [],

      getTodaysFact: () => {
        const today = todayStr();
        const history = get().shownHistory;

        // If we already showed a fact today, return that one (idempotent).
        const todaysEntry = history.find((h) => h.date === today);
        if (todaysEntry) {
          const fact = BRAIN_FACTS.find((f) => f.id === todaysEntry.id);
          if (fact) return fact;
        }

        // Build the set of fact IDs shown in the last 30 days.
        const recent = new Set(
          history.filter((h) => daysBetween(h.date, today) <= 30).map((h) => h.id),
        );

        // Start at day-of-year modulo length, walk forward until unseen.
        const startIndex = dayOfYear(new Date()) % BRAIN_FACTS.length;
        let pick = BRAIN_FACTS[startIndex];
        for (let i = 0; i < BRAIN_FACTS.length; i++) {
          const candidate = BRAIN_FACTS[(startIndex + i) % BRAIN_FACTS.length];
          if (!recent.has(candidate.id)) {
            pick = candidate;
            break;
          }
        }

        // Record it. Cap history at 60 entries.
        const newHistory = [...history, { id: pick.id, date: today }].slice(-60);
        set({ shownHistory: newHistory });

        return pick;
      },
    }),
    {
      name: 'neurra-fact-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ shownHistory: state.shownHistory }),
    },
  ),
);
