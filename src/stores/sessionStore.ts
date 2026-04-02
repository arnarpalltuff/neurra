import { create } from 'zustand';
import { GameId } from '../constants/gameConfigs';
import { GameResult } from './progressStore';

interface SessionState {
  activeGameIds: GameId[];
  currentGameIndex: number;
  results: GameResult[];
  sessionStarted: boolean;
  sessionComplete: boolean;
  bonusRoundAvailable: boolean;
  bonusRoundComplete: boolean;

  startSession: (gameIds: GameId[]) => void;
  recordGameResult: (result: GameResult) => void;
  nextGame: () => void;
  completeSession: () => void;
  resetSession: () => void;
  setBonusRoundAvailable: (val: boolean) => void;
  completeBonusRound: () => void;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  activeGameIds: [],
  currentGameIndex: 0,
  results: [],
  sessionStarted: false,
  sessionComplete: false,
  bonusRoundAvailable: true,
  bonusRoundComplete: false,

  startSession: (gameIds) =>
    set({
      activeGameIds: gameIds,
      currentGameIndex: 0,
      results: [],
      sessionStarted: true,
      sessionComplete: false,
    }),

  recordGameResult: (result) =>
    set((state) => ({ results: [...state.results, result] })),

  nextGame: () =>
    set((state) => ({ currentGameIndex: state.currentGameIndex + 1 })),

  completeSession: () => set({ sessionComplete: true }),

  resetSession: () =>
    set({
      activeGameIds: [],
      currentGameIndex: 0,
      results: [],
      sessionStarted: false,
      sessionComplete: false,
    }),

  setBonusRoundAvailable: (val) => set({ bonusRoundAvailable: val }),
  completeBonusRound: () => set({ bonusRoundComplete: true }),
}));
