import { GameId } from '../constants/gameConfigs';

export interface CoinRewardBreakdown {
  sessionComplete: number;
  streakMilestone: number;
  personalBests: number;
  perfectSession: number;
  firstGamePlays: number;
  levelUp: number;
  total: number;
  details: string[];
}

const STREAK_MILESTONES: Record<number, number> = {
  7: 100,
  14: 150,
  30: 300,
  60: 300,
  100: 300,
};

/**
 * Calculate coin rewards earned from a completed session.
 */
export function calcSessionCoinRewards(opts: {
  isFirstSessionToday: boolean;
  streak: number;
  isPerfect: boolean;
  personalBestGameIds: GameId[];
  firstTimeGameIds: GameId[];
  previousLevel: number;
  newLevel: number;
}): CoinRewardBreakdown {
  const details: string[] = [];
  let sessionComplete = 0;
  let streakMilestone = 0;
  let personalBests = 0;
  let perfectSession = 0;
  let firstGamePlays = 0;
  let levelUp = 0;

  // Daily session completion: 10 coins
  if (opts.isFirstSessionToday) {
    sessionComplete = 10;
    details.push('Daily session: +10');
  }

  // Streak milestones
  const milestoneReward = STREAK_MILESTONES[opts.streak];
  if (milestoneReward) {
    streakMilestone = milestoneReward;
    details.push(`${opts.streak}-day streak: +${milestoneReward}`);
  }

  // Personal bests: 25 each
  if (opts.personalBestGameIds.length > 0) {
    personalBests = opts.personalBestGameIds.length * 25;
    details.push(`${opts.personalBestGameIds.length} personal best${opts.personalBestGameIds.length > 1 ? 's' : ''}: +${personalBests}`);
  }

  // Perfect session (90%+ all games): 30
  if (opts.isPerfect) {
    perfectSession = 30;
    details.push('Perfect session: +30');
  }

  // First time playing a game: 50 each
  if (opts.firstTimeGameIds.length > 0) {
    firstGamePlays = opts.firstTimeGameIds.length * 50;
    details.push(`${opts.firstTimeGameIds.length} new game${opts.firstTimeGameIds.length > 1 ? 's' : ''}: +${firstGamePlays}`);
  }

  // Level up: 20 per level gained
  const levelsGained = opts.newLevel - opts.previousLevel;
  if (levelsGained > 0) {
    levelUp = levelsGained * 20;
    details.push(`Level up${levelsGained > 1 ? ` ×${levelsGained}` : ''}: +${levelUp}`);
  }

  const total = sessionComplete + streakMilestone + personalBests + perfectSession + firstGamePlays + levelUp;

  return {
    sessionComplete,
    streakMilestone,
    personalBests,
    perfectSession,
    firstGamePlays,
    levelUp,
    total,
    details,
  };
}

/** League reward coins based on final rank */
export function leagueRewardCoins(rank: number): number {
  if (rank === 1) return 300;
  if (rank <= 3) return 200;
  if (rank <= 10) return 150;
  if (rank <= 25) return 50;
  return 25;
}

/** Rewarded ad coin amount */
export const REWARDED_AD_COINS = 15;
export const MAX_REWARDED_ADS_PER_DAY = 3;

/** Streak freeze cost */
export const STREAK_FREEZE_COST = 100;

/** Streak repair cost (within 24h of break) */
export const STREAK_REPAIR_COST = 200;
