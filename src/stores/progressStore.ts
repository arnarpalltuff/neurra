import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameId, BrainArea } from '../constants/gameConfigs';
import { todayStr } from '../utils/timeUtils';

export interface GameResult {
  gameId: GameId;
  score: number;
  accuracy: number;
  date: string;
  personalBest: boolean;
}

export interface SessionRecord {
  id: string;
  date: string;
  games: GameResult[];
  totalXP: number;
  perfect: boolean;
}

export interface BrainScores {
  memory: number;
  focus: number;
  speed: number;
  flexibility: number;
  creativity: number;
}

interface ProgressState {
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  lastSessionDate: string | null;
  streakFreezes: number;
  streakFreezeUsedDate: string | null;
  totalSessions: number;
  sessions: SessionRecord[];
  gameHistory: Partial<Record<GameId, GameResult[]>>;
  personalBests: Partial<Record<GameId, number>>;
  gameLevels: Partial<Record<GameId, number>>;
  brainScores: BrainScores;
  coins: number;
  league: string;
  weeklyXP: number;
  weekStartDate: string;

  addXP: (amount: number) => void;
  addSession: (session: SessionRecord) => void;
  updateStreak: () => void;
  useStreakFreeze: () => boolean;
  addStreakFreeze: (count?: number) => void;
  updateGameLevel: (gameId: GameId, level: number) => void;
  updateBrainScores: (area: BrainArea, score: number) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  setLeague: (league: string) => void;
  isSessionDoneToday: () => boolean;
}

function xpForLevel(level: number): number {
  if (level <= 10) return level * 500;
  if (level <= 25) return 5000 + (level - 10) * 1000;
  if (level <= 50) return 20000 + (level - 25) * 2000;
  return 70000 + (level - 50) * 3000;
}

function levelFromXP(xp: number): number {
  let level = 1;
  let accumulated = 0;
  while (accumulated + xpForLevel(level) <= xp) {
    accumulated += xpForLevel(level);
    level++;
    if (level > 100) break;
  }
  return level;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      streak: 0,
      longestStreak: 0,
      lastSessionDate: null,
      streakFreezes: 0,
      streakFreezeUsedDate: null,
      totalSessions: 0,
      sessions: [],
      gameHistory: {},
      personalBests: {},
      gameLevels: {},
      brainScores: { memory: 0, focus: 0, speed: 0, flexibility: 0, creativity: 0 },
      coins: 0,
      league: 'Ember',
      weeklyXP: 0,
      weekStartDate: todayStr(),

      addXP: (amount) =>
        set((state) => {
          const newXP = state.xp + amount;
          return { xp: newXP, level: levelFromXP(newXP) };
        }),

      addSession: (session) =>
        set((state) => {
          const newGameHistory = { ...state.gameHistory };
          const newPersonalBests = { ...state.personalBests };

          for (const result of session.games) {
            const prev = newGameHistory[result.gameId] ?? [];
            newGameHistory[result.gameId] = [...prev, result].slice(-50);
            if (!newPersonalBests[result.gameId] || result.score > newPersonalBests[result.gameId]!) {
              newPersonalBests[result.gameId] = result.score;
            }
          }

          return {
            sessions: [...state.sessions.slice(-100), session],
            gameHistory: newGameHistory,
            personalBests: newPersonalBests,
            totalSessions: state.totalSessions + 1,
          };
        }),

      updateStreak: () =>
        set((state) => {
          const today = todayStr();
          if (state.lastSessionDate === today) return {};

          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          let newStreak = state.streak;

          if (state.lastSessionDate === yesterdayStr) {
            newStreak = state.streak + 1;
          } else if (state.lastSessionDate === null) {
            newStreak = 1;
          } else {
            // Check if streak freeze was used
            if (state.streakFreezeUsedDate === yesterdayStr && state.streakFreezes > 0) {
              newStreak = state.streak + 1;
            } else {
              newStreak = 1;
            }
          }

          return {
            streak: newStreak,
            longestStreak: Math.max(newStreak, state.longestStreak),
            lastSessionDate: today,
          };
        }),

      useStreakFreeze: () => {
        const state = get();
        if (state.streakFreezes <= 0) return false;
        set({ streakFreezes: state.streakFreezes - 1, streakFreezeUsedDate: todayStr() });
        return true;
      },

      addStreakFreeze: (count = 1) =>
        set((state) => ({
          streakFreezes: Math.min(state.streakFreezes + count, 3),
        })),

      updateGameLevel: (gameId, level) =>
        set((state) => ({
          gameLevels: { ...state.gameLevels, [gameId]: level },
        })),

      updateBrainScores: (area, score) =>
        set((state) => ({
          brainScores: {
            ...state.brainScores,
            [area]: Math.round((state.brainScores[area] * 0.8 + score * 0.2) * 10) / 10,
          },
        })),

      addCoins: (amount) =>
        set((state) => ({ coins: state.coins + amount })),

      spendCoins: (amount) => {
        const state = get();
        if (state.coins < amount) return false;
        set({ coins: state.coins - amount });
        return true;
      },

      setLeague: (league) => set({ league }),

      isSessionDoneToday: () => {
        const state = get();
        return state.lastSessionDate === todayStr();
      },
    }),
    {
      name: 'neurra-progress',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
