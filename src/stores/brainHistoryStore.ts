import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayStr } from '../utils/timeUtils';
import type { BrainScores } from './progressStore';

/**
 * F2 Brain Weather + F4 Deep Dive sparklines.
 *
 * Daily snapshot of the user's 5 brain area scores. One snapshot per local
 * calendar day (later writes overwrite). Capped at 90 entries.
 *
 * This data is the foundation for:
 *   - Brain Weather (classify week-over-week trend)
 *   - Brain area Deep Dive sparklines
 */

const MAX_SNAPSHOTS = 90;

export interface BrainSnapshot {
  date: string; // YYYY-MM-DD
  scores: BrainScores;
}

interface BrainHistoryState {
  snapshots: BrainSnapshot[];

  /** Idempotent: overwrites today's entry if it exists, appends otherwise. */
  recordSnapshot: (scores: BrainScores) => void;

  /** Snapshot from ~`daysAgo` days back. Falls back to the oldest snapshot if history is too short. Returns null if empty. */
  getSnapshotFromDaysAgo: (daysAgo: number) => BrainSnapshot | null;

  /** Last N snapshots in chronological order, padded with the oldest when sparse. */
  getRecent: (count: number) => BrainSnapshot[];
}

function daysBetween(a: string, b: string): number {
  const ad = new Date(`${a}T12:00:00`);
  const bd = new Date(`${b}T12:00:00`);
  return Math.round((bd.getTime() - ad.getTime()) / (1000 * 60 * 60 * 24));
}

export const useBrainHistoryStore = create<BrainHistoryState>()(
  persist(
    (set, get) => ({
      snapshots: [],

      recordSnapshot: (scores) =>
        set((s) => {
          const today = todayStr();
          const filtered = s.snapshots.filter((snap) => snap.date !== today);
          const next = [...filtered, { date: today, scores: { ...scores } }];
          // Keep chronological order — sort defensively in case of clock skew.
          next.sort((a, b) => (a.date < b.date ? -1 : 1));
          return { snapshots: next.slice(-MAX_SNAPSHOTS) };
        }),

      getSnapshotFromDaysAgo: (daysAgo) => {
        const s = get();
        if (s.snapshots.length === 0) return null;
        const today = todayStr();
        // Find the snapshot closest to (today - daysAgo) without going newer.
        let best: BrainSnapshot | null = null;
        let bestDiff = Infinity;
        for (const snap of s.snapshots) {
          const age = daysBetween(snap.date, today); // positive = older
          if (age < daysAgo) continue;
          const diff = age - daysAgo;
          if (diff < bestDiff) {
            best = snap;
            bestDiff = diff;
          }
        }
        // Fallback: oldest snapshot if nothing is old enough.
        return best ?? s.snapshots[0];
      },

      getRecent: (count) => {
        const s = get();
        return s.snapshots.slice(-count);
      },
    }),
    {
      name: 'neurra-brain-history',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
