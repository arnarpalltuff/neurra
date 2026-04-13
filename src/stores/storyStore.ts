import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayStr } from '../utils/timeUtils';

interface StoryState {
  storyEnabled: boolean;
  currentDay: number;
  unlockedBeacons: string[];
  companions: string[];
  lastStoryDate: string | null;

  // Actions
  setStoryEnabled: (v: boolean) => void;
  advanceDay: () => void;
  addBeacon: (id: string) => void;
  addCompanion: (id: string) => void;
  hasCompletedToday: () => boolean;
}

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      storyEnabled: false, // Disabled by default for v1 — re-enable post-launch once core loop is solid
      currentDay: 1,
      unlockedBeacons: [],
      companions: [],
      lastStoryDate: null,

      setStoryEnabled: (storyEnabled) => set({ storyEnabled }),

      advanceDay: () => {
        const { currentDay, lastStoryDate } = get();
        const today = todayStr();
        if (lastStoryDate === today) return;

        set({
          currentDay: currentDay + 1,
          lastStoryDate: today,
        });
      },

      addBeacon: (id) => {
        const { unlockedBeacons } = get();
        if (!unlockedBeacons.includes(id)) {
          set({ unlockedBeacons: [...unlockedBeacons, id] });
        }
      },

      addCompanion: (id) => {
        const { companions } = get();
        if (!companions.includes(id)) {
          set({ companions: [...companions, id] });
        }
      },

      hasCompletedToday: () => {
        return get().lastStoryDate === todayStr();
      },
    }),
    {
      name: 'neurra-story',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
