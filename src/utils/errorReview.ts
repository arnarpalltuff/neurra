import { GameId, gameConfigs, BrainArea, availableGames } from '../constants/gameConfigs';
import { GameResult, BrainScores } from '../stores/progressStore';

export interface WeakSpot {
  gameId: GameId;
  gameName: string;
  icon: string;
  brainArea: BrainArea;
  avgAccuracy: number; // 0-1
  trend: 'improving' | 'declining' | 'flat';
  recentAvg: number; // last 3 sessions avg accuracy
  suggestion: string;
}

export interface ErrorInsight {
  weakSpots: WeakSpot[];
  strongestGame: { gameId: GameId; avgAccuracy: number } | null;
  overallTrend: 'improving' | 'declining' | 'flat';
  focusPracticeGames: GameId[];
}

/**
 * Analyze game history to find weak spots and generate practice recommendations.
 */
export function analyzeErrors(
  gameHistory: Partial<Record<GameId, GameResult[]>>,
  brainScores: BrainScores,
): ErrorInsight {
  const gameStats: Array<{
    gameId: GameId;
    allAccuracy: number[];
    recentAccuracy: number[];
  }> = [];

  for (const [gameId, results] of Object.entries(gameHistory)) {
    if (!results || results.length < 2) continue;
    const sorted = [...results].sort((a, b) => a.date.localeCompare(b.date));
    const allAcc = sorted.map(r => r.accuracy);
    const recent = sorted.slice(-3).map(r => r.accuracy);
    gameStats.push({ gameId: gameId as GameId, allAccuracy: allAcc, recentAccuracy: recent });
  }

  if (gameStats.length === 0) {
    return { weakSpots: [], strongestGame: null, overallTrend: 'flat', focusPracticeGames: [] };
  }

  // Calculate weak spots: games with avg accuracy < 0.7 or declining trend
  const weakSpots: WeakSpot[] = [];
  let strongestGame: { gameId: GameId; avgAccuracy: number } | null = null;

  for (const gs of gameStats) {
    const config = gameConfigs[gs.gameId];
    if (!config) continue;

    const avg = gs.allAccuracy.reduce((a, b) => a + b, 0) / gs.allAccuracy.length;
    const recentAvg = gs.recentAccuracy.reduce((a, b) => a + b, 0) / gs.recentAccuracy.length;

    // Track strongest
    if (!strongestGame || avg > strongestGame.avgAccuracy) {
      strongestGame = { gameId: gs.gameId, avgAccuracy: avg };
    }

    // Determine trend
    const trend = getTrend(gs.allAccuracy);

    // It's a weak spot if recent accuracy < 0.7 or declining
    if (recentAvg < 0.7 || trend === 'declining') {
      const suggestion = getSuggestion(config.brainArea, recentAvg, trend);
      weakSpots.push({
        gameId: gs.gameId,
        gameName: config.name,
        icon: config.icon,
        brainArea: config.brainArea,
        avgAccuracy: avg,
        trend,
        recentAvg,
        suggestion,
      });
    }
  }

  // Sort by weakest first
  weakSpots.sort((a, b) => a.recentAvg - b.recentAvg);

  // Overall trend: compare first half vs second half of all sessions
  const allAccuracies = gameStats.flatMap(gs => gs.allAccuracy);
  const overallTrend = getTrend(allAccuracies);

  // Focus practice: pick games from weak brain areas
  const weakAreas = weakSpots.map(w => w.brainArea);
  const focusPracticeGames = selectFocusPracticeGames(weakAreas, brainScores);

  return { weakSpots: weakSpots.slice(0, 3), strongestGame, overallTrend, focusPracticeGames };
}

function getTrend(accuracies: number[]): 'improving' | 'declining' | 'flat' {
  if (accuracies.length < 3) return 'flat';
  const half = Math.floor(accuracies.length / 2);
  const firstHalf = accuracies.slice(0, half);
  const secondHalf = accuracies.slice(half);
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const diff = secondAvg - firstAvg;
  if (diff > 0.05) return 'improving';
  if (diff < -0.05) return 'declining';
  return 'flat';
}

function getSuggestion(area: BrainArea, recentAvg: number, trend: 'improving' | 'declining' | 'flat'): string {
  if (trend === 'declining') {
    return `Your ${area} has been slipping. A focused session can turn it around.`;
  }
  if (recentAvg < 0.5) {
    return `${area.charAt(0).toUpperCase() + area.slice(1)} needs work. Practice makes progress.`;
  }
  return `Your ${area} could use a boost. Try a focus session.`;
}

/**
 * Select 3 games targeting the user's weakest brain areas.
 */
export function selectFocusPracticeGames(
  weakAreas: BrainArea[],
  brainScores: BrainScores,
): GameId[] {
  // If no specific weak areas, use lowest brain scores
  const targetAreas = weakAreas.length > 0
    ? [...new Set(weakAreas)]
    : (Object.entries(brainScores) as Array<[BrainArea, number]>)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 2)
        .map(([area]) => area);

  const selected: GameId[] = [];

  // Pick games from weak areas first
  for (const area of targetAreas) {
    const games = availableGames.filter(g => g.brainArea === area && !selected.includes(g.id));
    if (games.length > 0) {
      selected.push(games[Math.floor(Math.random() * games.length)].id);
    }
    if (selected.length >= 3) break;
  }

  // Fill remaining slots
  while (selected.length < 3) {
    const remaining = availableGames.filter(g => !selected.includes(g.id));
    if (remaining.length === 0) break;
    selected.push(remaining[Math.floor(Math.random() * remaining.length)].id);
  }

  return selected.slice(0, 3);
}
