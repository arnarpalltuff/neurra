import { GameId } from '../constants/gameConfigs';

export interface SessionGameResult {
  gameId: GameId;
  score: number;
  accuracy: number;
}

export function calcSessionXP(results: SessionGameResult[]): number {
  const base = results.reduce((sum, r) => sum + Math.round(40 + r.accuracy * 40), 0);
  const perfect = results.every(r => r.accuracy >= 0.9) ? 100 : 0;
  return base + 50 + perfect;
}
