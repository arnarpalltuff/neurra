import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameId, gameConfigs } from '../constants/gameConfigs';
import {
  UNLOCK_SCHEDULE,
  SCHEDULE_LAST_DAY,
  unlockedAtDay,
} from '../constants/gameUnlockSchedule';
import { useUserStore } from './userStore';

/**
 * Progressive game unlock state.
 *
 * Tracks which games are currently unlocked and which days the user has
 * already seen "new game" celebrations for. The unlocked set is derived
 * from days-since-join via UNLOCK_SCHEDULE on every refresh.
 */

interface GameUnlockState {
  unlockedIds: GameId[];
  /** Days-since-join values for which the user has already seen the celebration. */
  celebratedDays: number[];

  /** Recompute unlocked set from joinDate. Returns newly unlocked game ids. */
  refresh: () => GameId[];
  /** True if a specific game is currently available to play. */
  isUnlocked: (gameId: GameId) => boolean;
  /** Mark a day's celebration as seen so we don't show it again. */
  markCelebrated: (day: number) => void;
}

function daysSinceJoin(): number {
  const join = useUserStore.getState().joinDate;
  if (!join) return SCHEDULE_LAST_DAY; // safety: legacy users see everything
  const joinTime = new Date(join).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - joinTime) / (1000 * 60 * 60 * 24)));
}

export const useGameUnlockStore = create<GameUnlockState>()(
  persist(
    (set, get) => ({
      // Initialize unlocked to ALL games — refresh() will narrow it on first call.
      // This means existing users (who installed before this feature) see no
      // regression: their games stay unlocked until refresh() runs.
      unlockedIds: Object.keys(gameConfigs) as GameId[],
      celebratedDays: [],

      refresh: () => {
        const day = daysSinceJoin();
        const expected = unlockedAtDay(day);
        const before = new Set(get().unlockedIds);
        const after = new Set(expected);
        const newlyUnlocked: GameId[] = [];
        for (const id of after) {
          if (!before.has(id)) newlyUnlocked.push(id);
        }
        // Only narrow to schedule for users who joined recently. For older
        // users (joined > SCHEDULE_LAST_DAY days ago) everything is unlocked.
        if (day >= SCHEDULE_LAST_DAY) {
          set({ unlockedIds: Object.keys(gameConfigs) as GameId[] });
        } else {
          set({ unlockedIds: expected });
        }
        return newlyUnlocked;
      },

      isUnlocked: (gameId) => get().unlockedIds.includes(gameId),

      markCelebrated: (day) => {
        const list = get().celebratedDays;
        if (!list.includes(day)) {
          set({ celebratedDays: [...list, day] });
        }
      },
    }),
    {
      name: 'neurra-game-unlock-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ unlockedIds: s.unlockedIds, celebratedDays: s.celebratedDays }),
    },
  ),
);

/** Re-export schedule helpers for convenience. */
export { daysSinceJoin };
