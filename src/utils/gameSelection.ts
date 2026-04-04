import { GameId, availableGames, gameConfigs, BrainArea } from '../constants/gameConfigs';
import { useProgressStore } from '../stores/progressStore';
import { useUserStore } from '../stores/userStore';
import { getSessionRecommendation } from './sessionRecommender';

export function selectDailyGames(): GameId[] {
  const progressState = useProgressStore.getState();
  const userState = useUserStore.getState();

  const rec = getSessionRecommendation(
    progressState.brainScores,
    progressState.gameHistory,
    userState.improvementGoals,
    userState.mood,
  );

  return rec.games;
}

export function selectOnboardingGames(): GameId[] {
  return ['ghost-kitchen', 'pulse', 'word-weave'];
}
