import { BrainArea } from './gameConfigs';

/**
 * Weekly skill challenges.
 *
 * Each Monday a new challenge appears on the home screen, targeting one
 * specific brain area. Progress is tracked over the week. Completing it
 * awards 200 XP + 100 coins + a badge.
 *
 * The active challenge is selected via week-of-year modulo length, so each
 * area gets equal coverage and the rotation is deterministic.
 */

export interface WeeklyChallengeDef {
  /** Stable id used for persistence and badge linkage. */
  id: string;
  /** Display name. */
  name: string;
  /** One-sentence framing. */
  description: string;
  /** Brain area being targeted. Used for color and progress filtering. */
  brainArea: BrainArea;
  /** Number of sessions including this brain area to complete. */
  targetSessions: number;
  /** Reward awarded on completion. */
  reward: {
    xp: number;
    coins: number;
    /** Linked achievement badge id (lands with Feature 8). */
    badgeId: string;
  };
}

export const WEEKLY_CHALLENGES: WeeklyChallengeDef[] = [
  {
    id: 'memory-week',
    name: 'Memory Week',
    description: 'Train memory in 5 sessions this week. Build the muscle.',
    brainArea: 'memory',
    targetSessions: 5,
    reward: { xp: 200, coins: 100, badgeId: 'memory-week-2025' },
  },
  {
    id: 'focus-week',
    name: 'Focus Week',
    description: 'Sharpen focus across 5 sessions. Quiet the noise.',
    brainArea: 'focus',
    targetSessions: 5,
    reward: { xp: 200, coins: 100, badgeId: 'focus-week-2025' },
  },
  {
    id: 'speed-week',
    name: 'Speed Week',
    description: 'Push your reactions in 5 sessions. Fast brain, sharp brain.',
    brainArea: 'speed',
    targetSessions: 5,
    reward: { xp: 200, coins: 100, badgeId: 'speed-week-2025' },
  },
  {
    id: 'flex-week',
    name: 'Flex Week',
    description: 'Train flexibility in 5 sessions. Bend, don\'t break.',
    brainArea: 'flexibility',
    targetSessions: 5,
    reward: { xp: 200, coins: 100, badgeId: 'flex-week-2025' },
  },
  {
    id: 'creativity-week',
    name: 'Creativity Week',
    description: 'Spark creativity across 5 sessions. New paths only.',
    brainArea: 'creativity',
    targetSessions: 5,
    reward: { xp: 200, coins: 100, badgeId: 'creativity-week-2025' },
  },
];

/** ISO date string for the Monday of the current week (or today if Monday). */
export function currentWeekMonday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // walk back to Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/**
 * Pick this week's challenge deterministically from the calendar week.
 *
 * Uses ISO week number modulo challenge count. Ensures the same challenge
 * is shown to a user across all installs and the rotation cycles every
 * 5 weeks.
 */
export function pickChallengeForWeek(monday: string): WeeklyChallengeDef {
  const d = new Date(monday);
  // Number of days since Jan 1, 2024 — arbitrary stable epoch.
  const epoch = new Date('2024-01-01');
  const days = Math.floor((d.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24));
  const week = Math.floor(days / 7);
  const idx = ((week % WEEKLY_CHALLENGES.length) + WEEKLY_CHALLENGES.length) % WEEKLY_CHALLENGES.length;
  return WEEKLY_CHALLENGES[idx];
}
