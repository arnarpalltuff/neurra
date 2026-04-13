import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Tiny tracker for the daily Brain Snapshot overlay shown on app open.
 *
 * One field: the date the snapshot was last shown. Used to gate the overlay
 * to once per day.
 */

interface SnapshotState {
  lastShownDate: string | null;
  markShownToday: () => void;
  shouldShowToday: () => boolean;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useSnapshotStore = create<SnapshotState>()(
  persist(
    (set, get) => ({
      lastShownDate: null,
      markShownToday: () => set({ lastShownDate: todayStr() }),
      shouldShowToday: () => get().lastShownDate !== todayStr(),
    }),
    {
      name: 'neurra-snapshot-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ lastShownDate: s.lastShownDate }),
    },
  ),
);
