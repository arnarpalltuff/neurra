import { GameId, availableGames, gameConfigs, BrainArea, AREA_LABELS } from '../constants/gameConfigs';
import { BrainScores, GameResult } from '../stores/progressStore';
import { getFreshnessWeights } from './gameFreshness';
import { getTimeOfDay } from './timeUtils';

export interface SessionRecommendation {
  games: GameId[];
  reason: string;
  type: 'balanced' | 'goal-focused' | 'weakness' | 'morning-boost' | 'evening-wind-down';
}

/**
 * Generate a smart session recommendation based on goals, performance, and context.
 */
export function getSessionRecommendation(
  brainScores: BrainScores,
  gameHistory: Partial<Record<GameId, GameResult[]>>,
  improvementGoals: BrainArea[],
  mood: string | null,
): SessionRecommendation {
  const timeOfDay = getTimeOfDay();
  const freshness = getFreshnessWeights(gameHistory);

  // Evening wind-down: prefer calmer games
  if (timeOfDay === 'lateNight' || (timeOfDay === 'evening' && mood === 'low')) {
    return buildRecommendation(
      ['memory', 'creativity'],
      gameHistory,
      freshness,
      'evening-wind-down',
      'Winding down with calmer exercises',
    );
  }

  // Morning: focus + speed boost
  if (timeOfDay === 'morning') {
    const areas: BrainArea[] = improvementGoals.length > 0
      ? improvementGoals.slice(0, 2)
      : ['focus', 'speed'];
    return buildRecommendation(
      areas,
      gameHistory,
      freshness,
      'morning-boost',
      'Morning brain wake-up',
    );
  }

  // Goal-focused: if user has set improvement goals
  if (improvementGoals.length > 0) {
    const goalLabels = improvementGoals.slice(0, 2).map(a => AREA_LABELS[a]).join(' & ');
    return buildRecommendation(
      improvementGoals,
      gameHistory,
      freshness,
      'goal-focused',
      `Targeting your goals: ${goalLabels}`,
    );
  }

  // Weakness-based: target lowest brain scores
  const areas = Object.entries(brainScores) as Array<[BrainArea, number]>;
  const weakest = areas.sort((a, b) => a[1] - b[1]).slice(0, 2).map(([a]) => a);
  const weakLabel = weakest.map(a => AREA_LABELS[a]).join(' & ');

  return buildRecommendation(
    weakest,
    gameHistory,
    freshness,
    'weakness',
    `Strengthening your ${weakLabel}`,
  );
}

function buildRecommendation(
  targetAreas: BrainArea[],
  gameHistory: Partial<Record<GameId, GameResult[]>>,
  freshness: Record<GameId, number>,
  type: SessionRecommendation['type'],
  reason: string,
): SessionRecommendation {
  const selected: GameId[] = [];

  // Pick games from target areas, weighted by freshness
  for (const area of targetAreas) {
    const candidates = availableGames
      .filter(g => g.brainArea === area && !selected.includes(g.id))
      .sort((a, b) => (freshness[b.id] ?? 1) - (freshness[a.id] ?? 1));
    if (candidates.length > 0) selected.push(candidates[0].id);
    if (selected.length >= 3) break;
  }

  // Fill with freshest remaining games
  while (selected.length < 3) {
    const remaining = availableGames
      .filter(g => !selected.includes(g.id))
      .sort((a, b) => (freshness[b.id] ?? 1) - (freshness[a.id] ?? 1));
    if (remaining.length === 0) break;
    selected.push(remaining[0].id);
  }

  return { games: selected.slice(0, 3), reason, type };
}

/**
 * Get a one-line insight about the recommended session.
 */
export function getRecommendationInsight(rec: SessionRecommendation): string {
  switch (rec.type) {
    case 'morning-boost':
      return 'Start your day sharp with focus and speed training.';
    case 'evening-wind-down':
      return 'Easy on the mind. Perfect for winding down.';
    case 'goal-focused':
      return rec.reason;
    case 'weakness':
      return `${rec.reason} — consistent practice makes the difference.`;
    default:
      return 'A balanced session to keep all areas active.';
  }
}
