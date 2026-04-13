import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayStr } from '../utils/timeUtils';

export type AgeGroup = 'under18' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';

/** F6 Adaptive Session Length. */
export type SessionLength = 'quick' | 'standard' | 'deep';

export const FREE_DEEP_SESSIONS_PER_WEEK = 2;

interface UserState {
  name: string;
  ageGroup: AgeGroup | null;
  onboardingComplete: boolean;
  notificationsEnabled: boolean;
  notificationTime: string; // "HH:MM"
  joinDate: string; // ISO date
  birthday: string | null;
  mood: 'great' | 'good' | 'okay' | 'low' | 'rough' | null;
  moodHistory: Array<{ date: string; mood: string }>;
  improvementGoals: Array<'memory' | 'focus' | 'speed' | 'flexibility' | 'creativity'>;
  /** F6: preferred session length. Persists across sessions. */
  sessionLength: SessionLength;
  /** F6: dates of recent Deep sessions, used to enforce 2/week free cap. */
  deepSessionDates: string[];
  setName: (name: string) => void;
  setAgeGroup: (ageGroup: AgeGroup) => void;
  setOnboardingComplete: () => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationTime: (time: string) => void;
  setBirthday: (date: string) => void;
  setMood: (mood: UserState['mood']) => void;
  setImprovementGoals: (goals: UserState['improvementGoals']) => void;
  setSessionLength: (length: SessionLength) => void;
  recordDeepSession: () => void;
  /** Returns the number of Deep sessions in the trailing 7 days. */
  deepSessionsThisWeek: () => number;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      name: '',
      ageGroup: null,
      onboardingComplete: false,
      notificationsEnabled: false,
      notificationTime: '09:00',
      joinDate: new Date().toISOString(),
      birthday: null,
      mood: null,
      moodHistory: [],
      improvementGoals: [],
      sessionLength: 'standard',
      deepSessionDates: [],
      setName: (name) => set({ name }),
      setAgeGroup: (ageGroup) => set({ ageGroup }),
      setOnboardingComplete: () => set({ onboardingComplete: true }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setNotificationTime: (notificationTime) => set({ notificationTime }),
      setBirthday: (birthday) => set({ birthday }),
      setMood: (mood) => set((s) => ({
        mood,
        moodHistory: mood
          ? [...s.moodHistory.slice(-90), { date: todayStr(), mood }]
          : s.moodHistory,
      })),
      setImprovementGoals: (improvementGoals) => set({ improvementGoals }),
      setSessionLength: (sessionLength) => set({ sessionLength }),
      recordDeepSession: () =>
        set((s) => ({
          deepSessionDates: [...s.deepSessionDates.slice(-13), todayStr()],
        })),
      deepSessionsThisWeek: () => {
        const s = get();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        return s.deepSessionDates.filter((d) => new Date(d) >= cutoff).length;
      },
    }),
    {
      name: 'neurra-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
