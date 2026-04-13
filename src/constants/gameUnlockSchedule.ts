import { GameId } from './gameConfigs';

/**
 * Progressive game unlock schedule.
 *
 * Day 1: Pulse only (simplest, most intuitive entry point).
 * New games unlock over the first two weeks. After day 14 everything is
 * available.
 *
 * Each entry maps day-since-join → games newly unlocked on that day.
 * "Day 0" = the day of first launch / joinDate.
 *
 * Tunable: shifting these doesn't break anything else, since the unlock
 * store derives state from this table on every check.
 */

export const UNLOCK_SCHEDULE: Record<number, GameId[]> = {
  0: ['pulse'],
  1: ['ghost-kitchen'],
  2: ['word-weave'],
  4: ['signal-noise', 'mirrors'],
  6: ['mind-drift', 'face-place'],
  9: ['chain-reaction', 'rewind'],
  13: ['split-focus', 'zen-flow'],
};

/** Highest day key in the schedule. After this, everything is unlocked. */
export const SCHEDULE_LAST_DAY = Math.max(...Object.keys(UNLOCK_SCHEDULE).map(Number));

/**
 * Compute the full unlocked set for a given days-since-join.
 * Returns all games unlocked at or before that day.
 */
export function unlockedAtDay(daysSinceJoin: number): GameId[] {
  const result: GameId[] = [];
  for (const dayStr in UNLOCK_SCHEDULE) {
    const day = Number(dayStr);
    if (day <= daysSinceJoin) result.push(...UNLOCK_SCHEDULE[day]);
  }
  return result;
}

/** Games newly unlocked on this exact day (for celebration). */
export function unlocksOnDay(daysSinceJoin: number): GameId[] {
  return UNLOCK_SCHEDULE[daysSinceJoin] ?? [];
}
