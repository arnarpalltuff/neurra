import { BrainArea, gameConfigs } from '../constants/gameConfigs';
import type { SessionRecord } from '../stores/progressStore';
import { KovaPersonality, personalityForArea } from '../constants/kovaPersonalityDialogue';

/**
 * Compute Kova's personality from the user's training pattern over the
 * last 30 days. Personality reflects the *dominant* brain area trained:
 * the area with the most game-plays in that window.
 *
 * Returns 'neutral' if there isn't enough data or if no area dominates
 * (within 20% of the next-most-trained).
 */

const WINDOW_DAYS = 30;
const MIN_PLAYS_TO_DECIDE = 6;
const DOMINANCE_MARGIN = 1.2; // top area must be 20% ahead of second

export function computeKovaPersonality(sessions: SessionRecord[]): KovaPersonality {
  const cutoff = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const counts: Record<BrainArea, number> = {
    memory: 0,
    focus: 0,
    speed: 0,
    flexibility: 0,
    creativity: 0,
  };

  for (const s of sessions) {
    if (new Date(s.date).getTime() < cutoff) continue;
    for (const g of s.games) {
      const area = gameConfigs[g.gameId]?.brainArea;
      if (area) counts[area]++;
    }
  }

  const totalPlays = Object.values(counts).reduce((a, b) => a + b, 0);
  if (totalPlays < MIN_PLAYS_TO_DECIDE) return 'neutral';

  const sorted = (Object.entries(counts) as Array<[BrainArea, number]>)
    .sort((a, b) => b[1] - a[1]);
  const [topArea, topCount] = sorted[0];
  const secondCount = sorted[1]?.[1] ?? 0;

  // If the top area isn't meaningfully ahead, stay neutral.
  if (secondCount > 0 && topCount / secondCount < DOMINANCE_MARGIN) return 'neutral';

  return personalityForArea(topArea);
}
