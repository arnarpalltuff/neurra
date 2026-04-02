import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  leaguesEnabled: boolean;
  friendActivityEnabled: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  theme: 'auto' | 'dark' | 'light';

  setSoundEnabled: (v: boolean) => void;
  setHapticsEnabled: (v: boolean) => void;
  setLeaguesEnabled: (v: boolean) => void;
  setFriendActivityEnabled: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
  setTheme: (v: 'auto' | 'dark' | 'light') => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      hapticsEnabled: true,
      leaguesEnabled: true,
      friendActivityEnabled: true,
      reduceMotion: false,
      highContrast: false,
      theme: 'auto',

      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setLeaguesEnabled: (leaguesEnabled) => set({ leaguesEnabled }),
      setFriendActivityEnabled: (friendActivityEnabled) => set({ friendActivityEnabled }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setHighContrast: (highContrast) => set({ highContrast }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'neurra-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
