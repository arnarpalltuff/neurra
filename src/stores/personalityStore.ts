import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KovaPersonality } from '../constants/kovaPersonalityDialogue';
import { computeKovaPersonality } from '../utils/kovaPersonality';
import { useProgressStore } from './progressStore';

/**
 * Kova personality cache.
 *
 * Recomputes the user's personality from session history every 7 days.
 * Reads sessions from progressStore at recompute time. The current
 * personality is exposed via `current()` for instant lookup elsewhere.
 */

const RECALC_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

interface PersonalityState {
  personality: KovaPersonality;
  lastRecalcAt: number | null;
  /** Recalculate if it's been 7+ days since last calc, or if forced. */
  recalcIfNeeded: (force?: boolean) => KovaPersonality;
  current: () => KovaPersonality;
}

export const usePersonalityStore = create<PersonalityState>()(
  persist(
    (set, get) => ({
      personality: 'neutral',
      lastRecalcAt: null,

      recalcIfNeeded: (force = false) => {
        const state = get();
        const due =
          force ||
          state.lastRecalcAt == null ||
          Date.now() - state.lastRecalcAt >= RECALC_INTERVAL_MS;
        if (!due) return state.personality;

        const sessions = useProgressStore.getState().sessions;
        const next = computeKovaPersonality(sessions);
        set({ personality: next, lastRecalcAt: Date.now() });
        return next;
      },

      current: () => get().personality,
    }),
    {
      name: 'neurra-personality-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ personality: s.personality, lastRecalcAt: s.lastRecalcAt }),
    },
  ),
);
