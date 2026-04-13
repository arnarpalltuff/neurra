import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BADGES, BadgeContext } from '../constants/badges';

/**
 * Achievement badge storage.
 *
 * Tracks unlocked badge ids and the date each was earned. The store also
 * provides an `evaluate` method that diffs the badge defs against the
 * current state and unlocks any whose check predicate now passes,
 * returning the *newly* unlocked badges so the caller can fire a
 * celebration moment.
 */

export interface UnlockedBadge {
  id: string;
  unlockedAt: number; // unix ms
}

interface AchievementState {
  unlocked: UnlockedBadge[];
  /** Evaluate badges against the given context. Returns newly unlocked ids. */
  evaluate: (ctx: BadgeContext) => string[];
  /** True if a badge id has been unlocked. */
  isUnlocked: (id: string) => boolean;
  /** Reset all badges (dev/test only). */
  clearAll: () => void;
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      unlocked: [],

      evaluate: (ctx) => {
        const existing = new Set(get().unlocked.map((u) => u.id));
        const newlyUnlocked: string[] = [];
        for (const def of BADGES) {
          if (existing.has(def.id)) continue;
          try {
            if (def.check(ctx)) newlyUnlocked.push(def.id);
          } catch {
            // Defensive: a buggy check shouldn't crash the session flow.
          }
        }
        if (newlyUnlocked.length > 0) {
          const now = Date.now();
          set({
            unlocked: [
              ...get().unlocked,
              ...newlyUnlocked.map((id) => ({ id, unlockedAt: now })),
            ],
          });
        }
        return newlyUnlocked;
      },

      isUnlocked: (id) => get().unlocked.some((u) => u.id === id),

      clearAll: () => set({ unlocked: [] }),
    }),
    {
      name: 'neurra-achievement-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ unlocked: s.unlocked }),
    },
  ),
);
