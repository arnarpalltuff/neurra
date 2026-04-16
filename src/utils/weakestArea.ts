import type { BrainArea } from '../constants/gameConfigs';
import type { BrainScores } from '../stores/progressStore';

const AREAS: BrainArea[] = ['memory', 'focus', 'speed', 'flexibility', 'creativity'];

/**
 * Lowest-scoring brain area. Matches the logic used by `insightsEngine.
 * calcBrainPulse` at `weakestArea = sorted[sorted.length - 1]`, kept as a
 * one-liner helper so home/insights/games share a single source of truth
 * without importing the full insights engine.
 *
 * Returns null only if every score is exactly zero — the "no data yet" case.
 * Ties resolve by area order (memory wins over focus etc.), which is stable.
 */
export function weakestArea(scores: BrainScores): BrainArea | null {
  const allZero = AREAS.every(a => (scores[a] ?? 0) === 0);
  if (allZero) return null;
  return AREAS.reduce((low, a) => (scores[a] < scores[low] ? a : low), AREAS[0]);
}
