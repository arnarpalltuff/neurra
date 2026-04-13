import { useProgressStore } from '../stores/progressStore';
import { useGroveStore } from '../stores/groveStore';
import { useProStore } from '../stores/proStore';
import { useAchievementStore } from '../stores/achievementStore';
import { BadgeContext } from '../constants/badges';

/**
 * Pull the latest state from all relevant stores, build a BadgeContext,
 * and run the achievement evaluator. Returns any newly unlocked badge ids.
 *
 * Call this after each session, on app open, or after any event that
 * might satisfy a badge condition.
 */
export function checkBadges(opts?: {
  totalCoinsEarned?: number;
  realChallengesCompleted?: number;
  friendChallengesCompleted?: number;
}): string[] {
  const p = useProgressStore.getState();
  const g = useGroveStore.getState();
  const pro = useProStore.getState();

  // Count grove zones at stage 6+. The grove store keys zones by area.
  const zoneGrowths = g.zoneGrowths ?? {};
  const groveZonesAtStage6Plus = Object.values(zoneGrowths).filter(
    (z: { currentGrowth?: number } | undefined) =>
      typeof z?.currentGrowth === 'number' && z.currentGrowth >= 6,
  ).length;

  const ctx: BadgeContext = {
    totalSessions: p.totalSessions,
    streak: p.streak,
    longestStreak: p.longestStreak,
    sessions: p.sessions,
    gameHistory: p.gameHistory,
    brainScores: p.brainScores,
    // Approximation: current balance is a lower bound for lifetime earned.
    totalCoinsEarned: opts?.totalCoinsEarned ?? p.coins,
    groveZonesAtStage6Plus,
    realChallengesCompleted: opts?.realChallengesCompleted ?? 0,
    friendChallengesCompleted: opts?.friendChallengesCompleted ?? 0,
    isFoundingMember: pro.isFoundingMember,
  };

  return useAchievementStore.getState().evaluate(ctx);
}
