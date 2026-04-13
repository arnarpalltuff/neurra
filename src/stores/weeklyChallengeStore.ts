import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BrainArea } from '../constants/gameConfigs';
import {
  WEEKLY_CHALLENGES,
  WeeklyChallengeDef,
  currentWeekMonday,
  pickChallengeForWeek,
} from '../constants/weeklyChallenges';

/**
 * Weekly skill challenge state.
 *
 * The active challenge is derived from the current week's Monday. Progress
 * resets when the week rolls over. Completion is rewarded once per week.
 */

interface WeeklyChallengeState {
  /** Monday of the week the current progress belongs to. */
  weekMonday: string;
  /** Id of the challenge being tracked this week. */
  challengeId: string;
  /** Number of qualifying sessions completed this week. */
  progress: number;
  /** True once the reward has been claimed for this week. */
  claimed: boolean;

  /**
   * Refresh state if the week has rolled over since last check. Call this
   * once at app start (from the root layout). After this, `getActive()` is
   * a pure read.
   */
  refreshWeek: () => void;
  /** Pure read — returns the currently active challenge definition. */
  getActive: () => WeeklyChallengeDef;
  /**
   * Record a session completion. If the session trained the targeted brain
   * area, progress increments. Returns true if this call completed the
   * challenge (just-now-completed transition).
   */
  recordSession: (areasTrained: BrainArea[]) => boolean;
  /** Mark the reward as claimed (caller awards XP/coins/badge). */
  markClaimed: () => void;
  /** True if the active challenge target is met but not yet claimed. */
  isCompleteUnclaimed: () => boolean;
}

const initialMonday = currentWeekMonday();
const initialChallenge = pickChallengeForWeek(initialMonday);

export const useWeeklyChallengeStore = create<WeeklyChallengeState>()(
  persist(
    (set, get) => ({
      weekMonday: initialMonday,
      challengeId: initialChallenge.id,
      progress: 0,
      claimed: false,

      refreshWeek: () => {
        const today = currentWeekMonday();
        if (get().weekMonday !== today) {
          const fresh = pickChallengeForWeek(today);
          set({
            weekMonday: today,
            challengeId: fresh.id,
            progress: 0,
            claimed: false,
          });
        }
      },

      getActive: () => {
        // Pure read — caller must have called refreshWeek() at app start.
        const state = get();
        return WEEKLY_CHALLENGES.find((c) => c.id === state.challengeId) ?? initialChallenge;
      },

      recordSession: (areasTrained) => {
        // Defensive: refresh in case of week rollover before recording.
        get().refreshWeek();
        const active = get().getActive();
        if (!areasTrained.includes(active.brainArea)) return false;
        const before = get().progress;
        if (before >= active.targetSessions) return false;
        const next = before + 1;
        set({ progress: next });
        return next >= active.targetSessions && !get().claimed;
      },

      markClaimed: () => set({ claimed: true }),

      isCompleteUnclaimed: () => {
        get().refreshWeek();
        const active = get().getActive();
        const state = get();
        return state.progress >= active.targetSessions && !state.claimed;
      },
    }),
    {
      name: 'neurra-weekly-challenge-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        weekMonday: s.weekMonday,
        challengeId: s.challengeId,
        progress: s.progress,
        claimed: s.claimed,
      }),
    },
  ),
);
