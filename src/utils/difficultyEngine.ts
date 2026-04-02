import { GameId } from '../constants/gameConfigs';
import { useProgressStore } from '../stores/progressStore';

export interface DifficultyState {
  level: number;
  rollingAccuracy: number;
  streakCorrect: number;
  streakWrong: number;
}

const defaultDifficulty: DifficultyState = {
  level: 1,
  rollingAccuracy: 0.75,
  streakCorrect: 0,
  streakWrong: 0,
};

// In-memory difficulty state per game per session
const sessionDifficulty: Partial<Record<GameId, DifficultyState>> = {};

export function getDifficulty(gameId: GameId, offset = 0): DifficultyState {
  if (!sessionDifficulty[gameId]) {
    const stored = useProgressStore.getState().gameLevels[gameId] ?? 1;
    sessionDifficulty[gameId] = {
      ...defaultDifficulty,
      level: Math.max(1, stored + offset),
    };
  }
  return sessionDifficulty[gameId]!;
}

export function updateDifficulty(gameId: GameId, correct: boolean): DifficultyState {
  const state = getDifficulty(gameId);
  const recent = correct ? 1 : 0;

  // Rolling accuracy (weighted average)
  const newAccuracy = state.rollingAccuracy * 0.9 + recent * 0.1;
  const newStreakCorrect = correct ? state.streakCorrect + 1 : 0;
  const newStreakWrong = !correct ? state.streakWrong + 1 : 0;

  let newLevel = state.level;

  if (newAccuracy > 0.85 && newStreakCorrect >= 3) {
    newLevel += 1;
  } else if (newAccuracy < 0.60 && newStreakWrong >= 2) {
    newLevel -= 1;
  } else if (newAccuracy > 0.80) {
    newLevel += 0.5;
  } else if (newAccuracy < 0.65) {
    newLevel -= 0.5;
  }

  newLevel = Math.max(1, Math.min(20, newLevel));

  const updated: DifficultyState = {
    level: newLevel,
    rollingAccuracy: newAccuracy,
    streakCorrect: newStreakCorrect,
    streakWrong: newStreakWrong,
  };

  sessionDifficulty[gameId] = updated;

  // Persist integer level
  useProgressStore.getState().updateGameLevel(gameId, Math.round(newLevel));

  return updated;
}

export function clearSessionDifficulty() {
  Object.keys(sessionDifficulty).forEach((k) => delete sessionDifficulty[k as GameId]);
}

// Ghost Kitchen parameters
export function ghostKitchenParams(level: number) {
  const l = Math.round(level);
  return {
    numIngredients: Math.min(2 + Math.floor(l / 3), 6),
    displayTime: Math.max(1500, 3000 - l * 75),
    numDistractors: Math.floor(l / 4),
  };
}

// Pulse parameters
export function pulseParams(level: number) {
  const l = Math.round(level);
  return {
    bpm: Math.min(80 + l * 5, 160),
    hasReverse: l >= 4,
    hasYellow: l >= 8,
    hasPairs: l >= 12,
    irregular: l >= 16,
  };
}

// Word Weave parameters
export function wordWeaveParams(level: number) {
  const l = Math.round(level);
  return {
    letterCount: Math.min(10 + Math.floor(l / 3), 14),
    timeLimit: Math.max(45, 60 - l),
    hasBonusLetters: l >= 5,
  };
}
