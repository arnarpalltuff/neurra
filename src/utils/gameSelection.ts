import { GameId, availableGames, gameConfigs, BrainArea } from '../constants/gameConfigs';
import { useProgressStore } from '../stores/progressStore';

export function selectDailyGames(): GameId[] {
  const state = useProgressStore.getState();
  const history = state.gameHistory;

  // Calculate brain area scores to find weakest/strongest
  const areas: BrainArea[] = ['memory', 'focus', 'speed', 'flexibility', 'creativity'];
  const scores = state.brainScores;

  const sorted = areas
    .filter((a) => availableGames.some((g) => g.brainArea === a))
    .sort((a, b) => scores[a] - scores[b]);

  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  const gamesForWeak = availableGames.filter((g) => g.brainArea === weakest);
  const gamesForStrong = availableGames.filter((g) => g.brainArea === strongest);

  // Get recently played games (last 3 days)
  const recentGames = new Set<GameId>();
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 1);

  for (const [gameId, results] of Object.entries(history)) {
    const recent = results?.some((r) => new Date(r.date) > threeDaysAgo);
    if (recent) recentGames.add(gameId as GameId);
  }

  const selected: GameId[] = [];

  // 1. Pick a game targeting the weakest area
  const weakGame = gamesForWeak.find((g) => !recentGames.has(g.id)) ?? gamesForWeak[0];
  if (weakGame) selected.push(weakGame.id);

  // 2. Pick a game targeting the strongest area (different from weak game)
  const strongGame = gamesForStrong
    .filter((g) => !selected.includes(g.id))
    .find((g) => !recentGames.has(g.id)) ?? gamesForStrong.find((g) => !selected.includes(g.id));
  if (strongGame && !selected.includes(strongGame.id)) selected.push(strongGame.id);

  // 3. Wildcard: least recently played game not already selected
  const wildcard = availableGames
    .filter((g) => !selected.includes(g.id))
    .sort((a, b) => {
      const aLast = history[a.id]?.slice(-1)[0]?.date ?? '2000-01-01';
      const bLast = history[b.id]?.slice(-1)[0]?.date ?? '2000-01-01';
      return aLast < bLast ? -1 : 1;
    })[0];

  if (wildcard) selected.push(wildcard.id);

  // Fallback: fill with available games if needed
  while (selected.length < 3) {
    const remaining = availableGames.filter((g) => !selected.includes(g.id));
    if (remaining.length === 0) break;
    selected.push(remaining[0].id);
  }

  return selected.slice(0, 3);
}

export function selectOnboardingGames(): GameId[] {
  return ['ghost-kitchen', 'pulse', 'word-weave'];
}
