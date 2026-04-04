import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayStr } from '../utils/timeUtils';

export type AgeGroup = 'under18' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';

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
  setName: (name: string) => void;
  setAgeGroup: (ageGroup: AgeGroup) => void;
  setOnboardingComplete: () => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationTime: (time: string) => void;
  setBirthday: (date: string) => void;
  setMood: (mood: UserState['mood']) => void;
  setImprovementGoals: (goals: UserState['improvementGoals']) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'neurra-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
