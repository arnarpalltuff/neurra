import { GameId, availableGames, gameConfigs } from '../constants/gameConfigs';
import { GameResult } from '../stores/progressStore';

export interface GamePlayStats {
  totalPlays: number;
  lastPlayed: string | null; // ISO date
  avgAccuracy: number;
  daysSinceLastPlay: number;
}

/**
 * Get play stats for all games.
 */
export function getPlayStats(
  gameHistory: Partial<Record<GameId, GameResult[]>>,
): Record<GameId, GamePlayStats> {
  const today = new Date();
  const result = {} as Record<GameId, GamePlayStats>;

  for (const game of availableGames) {
    const history = gameHistory[game.id];
    if (!history || history.length === 0) {
      result[game.id] = { totalPlays: 0, lastPlayed: null, avgAccuracy: 0, daysSinceLastPlay: Infinity };
      continue;
    }

    const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));
    const lastDate = sorted[0].date;
    const lastPlayedDate = new Date(lastDate);
    const daysSince = Math.floor((today.getTime() - lastPlayedDate.getTime()) / (1000 * 60 * 60 * 24));
    const avgAcc = history.reduce((sum, r) => sum + r.accuracy, 0) / history.length;

    result[game.id] = {
      totalPlays: history.length,
      lastPlayed: lastDate,
      avgAccuracy: avgAcc,
      daysSinceLastPlay: daysSince,
    };
  }

  return result;
}

/**
 * Select a "Game of the Day" — prioritizes games that haven't been played recently
 * or that the user hasn't tried yet. Uses the date as a seed for deterministic selection
 * (same game all day).
 */
export function getGameOfTheDay(
  gameHistory: Partial<Record<GameId, GameResult[]>>,
  precomputedStats?: Record<GameId, GamePlayStats>,
): GameId {
  const stats = precomputedStats ?? getPlayStats(gameHistory);
  const today = new Date();
  const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  // Score each game: higher = more likely to be picked
  const scored = availableGames
    .filter(g => g.id !== 'zen-flow') // Zen Flow is always available, not a "game of the day"
    .map(g => {
      const s = stats[g.id];
      let score = 0;

      // Never played = high priority
      if (s.totalPlays === 0) score += 100;

      // Days since last play (more days = higher score)
      score += Math.min(s.daysSinceLastPlay, 14) * 5;

      // Low play count = higher score
      score += Math.max(0, 20 - s.totalPlays) * 2;

      return { gameId: g.id, score };
    })
    .sort((a, b) => b.score - a.score);

  // Pick from top 3 using day seed for deterministic daily selection
  const top = scored.slice(0, Math.min(3, scored.length));
  const index = daySeed % top.length;
  return top[index].gameId;
}

/**
 * Get freshness-weighted game selection that avoids staleness.
 * Used to enhance daily game selection with variety.
 */
export function getFreshnessWeights(
  gameHistory: Partial<Record<GameId, GameResult[]>>,
): Record<GameId, number> {
  const stats = getPlayStats(gameHistory);
  const weights = {} as Record<GameId, number>;

  for (const game of availableGames) {
    const s = stats[game.id];
    let weight = 1;

    // Boost unplayed games
    if (s.totalPlays === 0) weight += 3;

    // Boost games not played recently
    weight += Math.min(s.daysSinceLastPlay, 7) * 0.5;

    // Slightly reduce weight of overplayed games
    if (s.totalPlays > 10) weight *= 0.8;

    weights[game.id] = weight;
  }

  return weights;
}
