import { GameId } from '../constants/gameConfigs';
import { useProgressStore } from '../stores/progressStore';
import { useSettingsStore } from '../stores/settingsStore';

/** Check if relaxed (untimed) mode is active */
export function isRelaxedMode(): boolean {
  return useSettingsStore.getState().relaxedMode;
}

const RELAXED_TIME_MULT = 2;
const RELAXED_LIMIT_MULT = 3;

function relaxedTime(value: number, relaxed?: boolean): number {
  const r = relaxed ?? isRelaxedMode();
  return r ? value * RELAXED_TIME_MULT : value;
}

function relaxedLimit(value: number, relaxed?: boolean): number {
  const r = relaxed ?? isRelaxedMode();
  return r ? value * RELAXED_LIMIT_MULT : value;
}

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
  const relaxed = isRelaxedMode();
  return {
    numIngredients: Math.min(2 + Math.floor(l / 3), 6),
    displayTime: relaxedTime(Math.max(1500, 3000 - l * 75), relaxed),
    numDistractors: Math.floor(l / 4),
  };
}

// Pulse parameters
export function pulseParams(level: number) {
  const l = Math.round(level);
  const relaxed = isRelaxedMode();
  return {
    bpm: relaxed ? Math.min(60 + l * 3, 100) : Math.min(80 + l * 5, 160),
    hasReverse: l >= 4,
    hasYellow: l >= 8,
    hasPairs: l >= 12,
    irregular: !relaxed && l >= 16,
  };
}

// Word Weave parameters
export function wordWeaveParams(level: number) {
  const l = Math.round(level);
  const relaxed = isRelaxedMode();
  return {
    letterCount: Math.min(10 + Math.floor(l / 3), 14),
    timeLimit: relaxedLimit(Math.max(45, 60 - l), relaxed),
    hasBonusLetters: l >= 5,
  };
}

// Face Place parameters
export function facePlaceParams(level: number) {
  const l = Math.round(level);
  const relaxed = isRelaxedMode();
  return {
    numFaces: Math.min(3 + Math.floor(l / 3), 8),
    displayTime: relaxedTime(Math.max(2000, 4000 - l * 100), relaxed),
    recallType: l >= 8 ? 'type' as const : 'choice' as const,
    numChoices: Math.min(3 + Math.floor(l / 4), 6),
  };
}

// Signal & Noise parameters
export function signalNoiseParams(level: number) {
  const l = Math.round(level);
  const relaxed = isRelaxedMode();
  return {
    numShapes: Math.min(5 + Math.floor(l / 2), 12),
    changeInterval: relaxedTime(Math.max(2500, 4500 - l * 100), relaxed),
    subtlety: Math.min(l * 0.05, 0.8),
    totalChanges: Math.min(6 + Math.floor(l / 3), 14),
  };
}

// Chain Reaction parameters
export function chainReactionParams(level: number) {
  const l = Math.round(level);
  const relaxed = isRelaxedMode();
  return {
    seqLength: Math.min(3 + Math.floor(l / 4), 6),
    numOrbs: Math.min(10 + Math.floor(l / 2), 16),
    driftSpeed: relaxed ? (0.3 + l * 0.08) * 0.5 : 0.3 + l * 0.08,
    numColors: Math.min(3 + Math.floor(l / 4), 6),
    totalChains: Math.min(4 + Math.floor(l / 3), 10),
  };
}

// Mind Drift parameters
export function mindDriftParams(level: number) {
  const l = Math.round(level);
  const relaxed = isRelaxedMode();
  return {
    gridRows: Math.min(4 + Math.floor(l / 5), 7),
    gridCols: Math.min(4 + Math.floor(l / 5), 7),
    pathLength: Math.min(3 + Math.floor(l / 2), 10),
    showDelay: relaxedTime(Math.max(300, 600 - l * 20), relaxed),
    totalRounds: Math.min(5 + Math.floor(l / 3), 10),
  };
}

// Rewind parameters
export function rewindParams(level: number) {
  const l = Math.round(level);
  const relaxed = isRelaxedMode();
  return {
    numItems: Math.min(3 + Math.floor(l / 3), 7),
    studyTime: relaxedTime(Math.max(2000, 5000 - l * 150), relaxed),
    numQuestions: Math.min(3 + Math.floor(l / 4), 6),
    totalScenes: Math.min(4 + Math.floor(l / 3), 8),
  };
}

// Mirrors parameters
export function mirrorsParams(level: number) {
  const l = Math.round(level);
  const relaxed = isRelaxedMode();
  return {
    totalTrials: Math.min(12 + Math.floor(l / 2), 24),
    switchEvery: Math.max(2, 6 - Math.floor(l / 3)),
    numRules: Math.min(2 + Math.floor(l / 4), 4),
    timeLimit: relaxedLimit(Math.max(1500, 3000 - l * 80), relaxed),
  };
}

// Split Focus parameters
export function splitFocusParams(level: number) {
  const l = Math.round(level);
  return {
    numberCount: Math.min(4 + Math.floor(l / 3), 9),
    colorTimeMs: isRelaxedMode() ? 6000 : Math.max(2000, 4000 - l * 100),
    totalRounds: 8,
  };
}
