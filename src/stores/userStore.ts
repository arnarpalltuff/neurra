import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserState {
  name: string;
  onboardingComplete: boolean;
  notificationsEnabled: boolean;
  notificationTime: string; // "HH:MM"
  joinDate: string; // ISO date
  birthday: string | null;
  setName: (name: string) => void;
  setOnboardingComplete: () => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationTime: (time: string) => void;
  setBirthday: (date: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      name: '',
      onboardingComplete: false,
      notificationsEnabled: false,
      notificationTime: '09:00',
      joinDate: new Date().toISOString(),
      birthday: null,
      setName: (name) => set({ name }),
      setOnboardingComplete: () => set({ onboardingComplete: true }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setNotificationTime: (notificationTime) => set({ notificationTime }),
      setBirthday: (birthday) => set({ birthday }),
    }),
    {
      name: 'neurra-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
