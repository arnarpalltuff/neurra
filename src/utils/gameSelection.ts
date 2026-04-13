import { GameId, availableGames, gameConfigs, BrainArea } from '../constants/gameConfigs';
import { useProgressStore } from '../stores/progressStore';
import { useUserStore, type SessionLength } from '../stores/userStore';
import { useGameUnlockStore } from '../stores/gameUnlockStore';
import { getSessionRecommendation } from './sessionRecommender';

/** F6 Adaptive Session Length: number of games per length. */
const LENGTH_TO_COUNT: Record<SessionLength, number> = {
  quick: 2,
  standard: 3,
  deep: 5,
};

/**
 * Pick the games for today's session.
 *
 * `length` controls how many games. Quick=2, Standard=3, Deep=5.
 * Deep sessions reserve slot 4 for Zen Flow as a mid-session breather.
 */
export function selectDailyGames(length: SessionLength = 'standard'): GameId[] {
  const progressState = useProgressStore.getState();
  const userState = useUserStore.getState();

  const rec = getSessionRecommendation(
    progressState.brainScores,
    progressState.gameHistory,
    userState.improvementGoals,
    userState.mood,
  );

  const unlockedSet = new Set(useGameUnlockStore.getState().unlockedIds);
  const filtered = rec.games.filter((g) => unlockedSet.has(g));
  if (filtered.length === 0) {
    return Array.from(unlockedSet).slice(0, 1) as GameId[];
  }

  const targetCount = LENGTH_TO_COUNT[length];

  // Top up from the unlocked pool if the recommendation is short.
  const pool: GameId[] = [...filtered];
  if (pool.length < targetCount) {
    for (const id of unlockedSet) {
      if (pool.length >= targetCount) break;
      if (!pool.includes(id)) pool.push(id);
    }
  }
  let chosen = pool.slice(0, targetCount);

  // Deep mode: ensure Zen Flow sits at the mid-session breather slot (index 3
  // out of 5). If Zen Flow isn't unlocked yet, the slot just stays whatever
  // the recommender picked.
  if (length === 'deep' && unlockedSet.has('zen-flow') && chosen.length === 5) {
    chosen = chosen.filter((g) => g !== 'zen-flow');
    // Drop the lowest-priority pick to make room.
    if (chosen.length > 4) chosen = chosen.slice(0, 4);
    chosen.splice(3, 0, 'zen-flow');
  }

  return chosen;
}

export function selectOnboardingGames(): GameId[] {
  return ['ghost-kitchen', 'pulse', 'word-weave'];
}
