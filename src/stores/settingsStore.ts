import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BrainArea } from '../constants/gameConfigs';

export type AppTheme = 'auto' | 'dark' | 'light';
export type DifficultyPref = 'adaptive' | 'challenge' | 'easy';
export type ZenFlowPref = 'always' | 'sometimes' | 'never';
export type TextSize = 'system' | 'small' | 'medium' | 'large' | 'xlarge';
export type ColorBlindMode = 'off' | 'deuteranopia' | 'protanopia' | 'tritanopia';
export type TapTargetSize = 'standard' | 'large';
export type KovaSize = 'small' | 'medium' | 'large';

interface SettingsState {
  // Sound & haptics
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number; // 0-1
  hapticsEnabled: boolean;

  // Notifications
  dailyReminder: boolean;
  reminderTime: string; // "HH:MM"
  streakProtectionAlert: boolean;
  leagueUpdates: boolean;
  friendActivity: boolean;
  quietHoursStart: string; // "HH:MM"
  quietHoursEnd: string;   // "HH:MM"

  // Session preferences
  sessionLength: 3 | 5;
  focusAreas: Record<BrainArea, boolean>;
  difficultyPref: DifficultyPref;
  zenFlowInclusion: ZenFlowPref;

  // Competition
  leaguesEnabled: boolean;
  friendActivityEnabled: boolean;
  allowFriendRequests: boolean;
  showOnLeaderboards: boolean;

  // Appearance
  theme: AppTheme;
  kovaSize: KovaSize;
  reduceAnimations: boolean;

  // Accessibility
  textSize: TextSize;
  highContrast: boolean;
  screenReaderOptimized: boolean;
  reduceMotion: boolean;
  colorBlindMode: ColorBlindMode;
  tapTargetSize: TapTargetSize;

  // Actions
  setSoundEnabled: (v: boolean) => void;
  setMusicEnabled: (v: boolean) => void;
  setVolume: (v: number) => void;
  setHapticsEnabled: (v: boolean) => void;
  setDailyReminder: (v: boolean) => void;
  setReminderTime: (v: string) => void;
  setStreakProtectionAlert: (v: boolean) => void;
  setLeagueUpdates: (v: boolean) => void;
  setFriendActivityNotif: (v: boolean) => void;
  setQuietHours: (start: string, end: string) => void;
  setSessionLength: (v: 3 | 5) => void;
  setFocusArea: (area: BrainArea, enabled: boolean) => void;
  setDifficultyPref: (v: DifficultyPref) => void;
  setZenFlowInclusion: (v: ZenFlowPref) => void;
  setLeaguesEnabled: (v: boolean) => void;
  setFriendActivityEnabled: (v: boolean) => void;
  setAllowFriendRequests: (v: boolean) => void;
  setShowOnLeaderboards: (v: boolean) => void;
  setTheme: (v: AppTheme) => void;
  setKovaSize: (v: KovaSize) => void;
  setReduceAnimations: (v: boolean) => void;
  setTextSize: (v: TextSize) => void;
  setHighContrast: (v: boolean) => void;
  setScreenReaderOptimized: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setColorBlindMode: (v: ColorBlindMode) => void;
  setTapTargetSize: (v: TapTargetSize) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      soundEnabled: true,
      musicEnabled: true,
      volume: 0.8,
      hapticsEnabled: true,

      dailyReminder: true,
      reminderTime: '09:00',
      streakProtectionAlert: true,
      leagueUpdates: true,
      friendActivity: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',

      sessionLength: 3,
      focusAreas: {
        memory: true,
        focus: true,
        speed: true,
        flexibility: true,
        creativity: true,
      },
      difficultyPref: 'adaptive',
      zenFlowInclusion: 'sometimes',

      leaguesEnabled: true,
      friendActivityEnabled: true,
      allowFriendRequests: true,
      showOnLeaderboards: true,

      theme: 'auto',
      kovaSize: 'medium',
      reduceAnimations: false,

      textSize: 'system',
      highContrast: false,
      screenReaderOptimized: false,
      reduceMotion: false,
      colorBlindMode: 'off',
      tapTargetSize: 'standard',

      // Setters
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setMusicEnabled: (musicEnabled) => set({ musicEnabled }),
      setVolume: (volume) => set({ volume }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setDailyReminder: (dailyReminder) => set({ dailyReminder }),
      setReminderTime: (reminderTime) => set({ reminderTime }),
      setStreakProtectionAlert: (streakProtectionAlert) => set({ streakProtectionAlert }),
      setLeagueUpdates: (leagueUpdates) => set({ leagueUpdates }),
      setFriendActivityNotif: (friendActivity) => set({ friendActivity }),
      setQuietHours: (quietHoursStart, quietHoursEnd) => set({ quietHoursStart, quietHoursEnd }),
      setSessionLength: (sessionLength) => set({ sessionLength }),
      setFocusArea: (area, enabled) =>
        set((s) => ({
          focusAreas: { ...s.focusAreas, [area]: enabled },
        })),
      setDifficultyPref: (difficultyPref) => set({ difficultyPref }),
      setZenFlowInclusion: (zenFlowInclusion) => set({ zenFlowInclusion }),
      setLeaguesEnabled: (leaguesEnabled) => set({ leaguesEnabled }),
      setFriendActivityEnabled: (friendActivityEnabled) => set({ friendActivityEnabled }),
      setAllowFriendRequests: (allowFriendRequests) => set({ allowFriendRequests }),
      setShowOnLeaderboards: (showOnLeaderboards) => set({ showOnLeaderboards }),
      setTheme: (theme) => set({ theme }),
      setKovaSize: (kovaSize) => set({ kovaSize }),
      setReduceAnimations: (reduceAnimations) => set({ reduceAnimations }),
      setTextSize: (textSize) => set({ textSize }),
      setHighContrast: (highContrast) => set({ highContrast }),
      setScreenReaderOptimized: (screenReaderOptimized) => set({ screenReaderOptimized }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setColorBlindMode: (colorBlindMode) => set({ colorBlindMode }),
      setTapTargetSize: (tapTargetSize) => set({ tapTargetSize }),
    }),
    {
      name: 'neurra-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
