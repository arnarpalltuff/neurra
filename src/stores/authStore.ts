import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayStr } from '../utils/timeUtils';

// ── Types ──────────────────────────────────────────────

export type AuthProvider = 'google' | 'apple' | 'email';

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  provider: AuthProvider;
  createdAt: string;
}

// ── Sync Queue ─────────────────────────────────────────

export interface SyncAction {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

// ── Store ──────────────────────────────────────────────

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  lastSyncDate: string | null;
  syncQueue: SyncAction[];
  accountPromptDismissCount: number;
  accountPromptLastDate: string | null;

  // Actions
  signIn: (user: AuthUser) => void;
  signOut: () => void;
  updateProfile: (updates: Partial<Pick<AuthUser, 'displayName' | 'email'>>) => void;
  recordSync: () => void;
  addToSyncQueue: (action: Omit<SyncAction, 'id' | 'timestamp'>) => void;
  clearSyncQueue: () => void;
  dismissAccountPrompt: () => void;
  shouldShowAccountPrompt: (totalSessions: number) => boolean;
  deleteAccount: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      lastSyncDate: null,
      syncQueue: [],
      accountPromptDismissCount: 0,
      accountPromptLastDate: null,

      signIn: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      signOut: () =>
        set({
          user: null,
          isAuthenticated: false,
          lastSyncDate: null,
          syncQueue: [],
        }),

      updateProfile: (updates) =>
        set((s) => ({
          user: s.user ? { ...s.user, ...updates } : null,
        })),

      recordSync: () =>
        set({ lastSyncDate: new Date().toISOString() }),

      addToSyncQueue: (action) =>
        set((s) => ({
          syncQueue: [
            ...s.syncQueue,
            {
              ...action,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              timestamp: Date.now(),
            },
          ],
        })),

      clearSyncQueue: () => set({ syncQueue: [] }),

      dismissAccountPrompt: () =>
        set((s) => ({
          accountPromptDismissCount: s.accountPromptDismissCount + 1,
          accountPromptLastDate: todayStr(),
        })),

      shouldShowAccountPrompt: (totalSessions) => {
        const s = get();
        if (s.isAuthenticated) return false;
        // Show on session 3, 5, 7 — then stop
        if (s.accountPromptDismissCount >= 3) return false;
        const promptSessions = [3, 5, 7];
        return promptSessions.includes(totalSessions);
      },

      deleteAccount: () =>
        set({
          user: null,
          isAuthenticated: false,
          lastSyncDate: null,
          syncQueue: [],
          accountPromptDismissCount: 0,
          accountPromptLastDate: null,
        }),
    }),
    {
      name: 'neurra-auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
