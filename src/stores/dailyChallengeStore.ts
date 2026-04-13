import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDateStr } from '../utils/timeUtils';
import { GameId, gameConfigs, availableGames } from '../constants/gameConfigs';

// ── Types ────────────────────────────────────────────────────

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';
export type ChallengeStatus = 'available' | 'completed' | 'expired';

export interface DailyChallenge {
  id: string;
  gameType: GameId;
  difficulty: ChallengeDifficulty;
  status: ChallengeStatus;
  availableAt: string;   // ISO timestamp
  expiresAt: string;     // ISO timestamp (24h after availableAt)
  xpReward: number;
  completedAt?: string;
  score?: number;
}

// ── Config ───────────────────────────────────────────────────

const BASE_XP: Record<ChallengeDifficulty, number> = {
  easy: 20,
  medium: 35,
  hard: 50,
};

const DIFFICULTY_ICONS: Record<ChallengeDifficulty, string> = {
  easy: '🟢',
  medium: '🟡',
  hard: '🔴',
};

export { DIFFICULTY_ICONS };

/**
 * Determine difficulty mix based on Kova's evolution stage.
 * Returns an array of 3 difficulties for the 3 daily challenges.
 */
function difficultyMixForStage(stage: number): ChallengeDifficulty[] {
  if (stage <= 2) return ['easy', 'easy', 'easy'];
  if (stage <= 4) return ['easy', 'easy', 'medium'];
  if (stage === 5) return ['easy', 'medium', 'hard'];
  return ['medium', 'hard', 'hard'];
}

/**
 * Pick 3 different game types for daily challenges.
 */
function pickDailyGames(): GameId[] {
  const games = availableGames.map(g => g.id);
  const shuffled = [...games].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

/**
 * Generate today's 3 challenges.
 */
function generateChallenges(kovaStage: number): DailyChallenge[] {
  const difficulties = difficultyMixForStage(kovaStage);
  const gameIds = pickDailyGames();
  const now = new Date();
  const availableAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  return gameIds.map((gameType, i) => ({
    id: `daily_${localDateStr()}_${i}`,
    gameType,
    difficulty: difficulties[i],
    status: 'available' as ChallengeStatus,
    availableAt,
    expiresAt,
    xpReward: BASE_XP[difficulties[i]],
  }));
}

// ── Store ────────────────────────────────────────────────────

interface DailyChallengeState {
  challenges: DailyChallenge[];
  lastRefreshDate: string | null;
  bonusChallenges: DailyChallenge[];

  /**
   * Call on app open. Refreshes challenges if it's a new day.
   * @param kovaStage — current Kova evolution stage for difficulty scaling
   */
  refreshIfNeeded: (kovaStage: number) => void;

  /**
   * Mark a challenge as completed.
   * Returns the challenge if found and was available, null otherwise.
   */
  completeChallenge: (challengeId: string, score: number) => DailyChallenge | null;

  /**
   * Add a bonus challenge (from reward chest).
   */
  addBonusChallenge: (kovaStage: number) => void;

  /**
   * Get remaining available challenges (not expired, not completed).
   */
  getAvailableChallenges: () => DailyChallenge[];

  /**
   * Get milliseconds until today's challenges expire.
   */
  getExpirationMs: () => number;
}

export const useDailyChallengeStore = create<DailyChallengeState>()(
  persist(
    (set, get) => ({
      challenges: [],
      lastRefreshDate: null,
      bonusChallenges: [],

      refreshIfNeeded: (kovaStage) => {
        const { challenges, lastRefreshDate } = get();
        const today = localDateStr();

        if (lastRefreshDate === today) {
          // Same day — only write state if something actually expired
          const now = Date.now();
          const anyExpired = challenges.some(c => c.status === 'available' && new Date(c.expiresAt).getTime() < now);
          const anyBonusExpired = get().bonusChallenges.some(c => c.status === 'available' && new Date(c.expiresAt).getTime() < now);
          if (!anyExpired && !anyBonusExpired) return;

          const updated = challenges.map(c =>
            c.status === 'available' && new Date(c.expiresAt).getTime() < now
              ? { ...c, status: 'expired' as ChallengeStatus }
              : c,
          );
          const bonusUpdated = get().bonusChallenges.map(c =>
            c.status === 'available' && new Date(c.expiresAt).getTime() < now
              ? { ...c, status: 'expired' as ChallengeStatus }
              : c,
          );
          set({ challenges: updated, bonusChallenges: bonusUpdated });
          return;
        }

        // New day — expire old, generate new
        const expired = challenges.map(c =>
          c.status === 'available'
            ? { ...c, status: 'expired' as ChallengeStatus }
            : c,
        );
        const newChallenges = generateChallenges(kovaStage);

        set({
          challenges: newChallenges,
          lastRefreshDate: today,
          // Bonus challenges carry over but get expired if timed out
          bonusChallenges: get().bonusChallenges.filter(c => {
            if (c.status !== 'available') return false;
            return new Date(c.expiresAt).getTime() > Date.now();
          }),
        });
      },

      completeChallenge: (challengeId, score) => {
        const { challenges, bonusChallenges } = get();
        const now = new Date().toISOString();

        // Check regular challenges
        const idx = challenges.findIndex(c => c.id === challengeId && c.status === 'available');
        if (idx >= 0) {
          const challenge = { ...challenges[idx], status: 'completed' as ChallengeStatus, completedAt: now, score };
          const updated = [...challenges];
          updated[idx] = challenge;
          set({ challenges: updated });
          return challenge;
        }

        // Check bonus challenges
        const bIdx = bonusChallenges.findIndex(c => c.id === challengeId && c.status === 'available');
        if (bIdx >= 0) {
          const challenge = { ...bonusChallenges[bIdx], status: 'completed' as ChallengeStatus, completedAt: now, score };
          const updated = [...bonusChallenges];
          updated[bIdx] = challenge;
          set({ bonusChallenges: updated });
          return challenge;
        }

        return null;
      },

      addBonusChallenge: (kovaStage) => {
        const { bonusChallenges } = get();
        const now = new Date();
        // Bonus challenges expire at end of next day
        const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
        const games = availableGames.map(g => g.id);
        const gameType = games[Math.floor(Math.random() * games.length)];

        const bonus: DailyChallenge = {
          id: `bonus_${Date.now()}`,
          gameType,
          difficulty: 'medium',
          status: 'available',
          availableAt: now.toISOString(),
          expiresAt,
          xpReward: Math.round(BASE_XP.medium * 1.5),
        };

        set({ bonusChallenges: [...bonusChallenges, bonus] });
      },

      getAvailableChallenges: () => {
        const { challenges, bonusChallenges } = get();
        const now = Date.now();
        return [...challenges, ...bonusChallenges].filter(
          c => c.status === 'available' && new Date(c.expiresAt).getTime() > now,
        );
      },

      getExpirationMs: () => {
        const { challenges } = get();
        if (challenges.length === 0) return 0;
        const firstAvailable = challenges.find(c => c.status === 'available');
        if (!firstAvailable) return 0;
        return Math.max(0, new Date(firstAvailable.expiresAt).getTime() - Date.now());
      },
    }),
    {
      name: 'neurra-daily-challenges',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
