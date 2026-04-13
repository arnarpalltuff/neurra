import { GameId, BrainArea } from './gameConfigs';
import type { SessionRecord, GameResult, BrainScores } from '../stores/progressStore';

/**
 * 25 achievement badges.
 *
 * Each badge has a stable id, display info, and a `check(ctx)` predicate
 * that takes the current state and returns true if the badge should be
 * unlocked. The check is pure — no side effects.
 *
 * Some checks reference data the store doesn't currently track (e.g.
 * exact game-completion duration, return-after-absence). Those return
 * false today and will start unlocking once the relevant tracking lands.
 * The badge defs themselves are stable, so future plumbing won't require
 * a constants migration.
 */

export type BadgeCategory = 'milestone' | 'streak' | 'mastery' | 'exploration' | 'special';

export interface BadgeContext {
  totalSessions: number;
  streak: number;
  longestStreak: number;
  sessions: SessionRecord[];
  gameHistory: Partial<Record<GameId, GameResult[]>>;
  brainScores: BrainScores;
  /** Lifetime coins earned (not current balance). Approximate from sessions if needed. */
  totalCoinsEarned: number;
  /** Grove zones at stage 6+. Lengths up to 5. */
  groveZonesAtStage6Plus: number;
  /** Real-life challenges completed. Optional — defaults to 0. */
  realChallengesCompleted: number;
  /** Friend challenges completed. Optional — defaults to 0. */
  friendChallengesCompleted: number;
  /** True if user is a founding member. */
  isFoundingMember: boolean;
}

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  check: (ctx: BadgeContext) => boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────

const sessionHour = (s: SessionRecord): number => new Date(s.date).getHours();

const allGamesPlayed = (history: BadgeContext['gameHistory']): boolean => {
  const ids: GameId[] = [
    'ghost-kitchen', 'pulse', 'word-weave', 'face-place', 'signal-noise',
    'chain-reaction', 'mind-drift', 'rewind', 'mirrors', 'zen-flow', 'split-focus',
  ];
  return ids.every((id) => (history[id]?.length ?? 0) > 0);
};

const sessionsOfGame = (history: BadgeContext['gameHistory'], gameId: GameId): number =>
  history[gameId]?.length ?? 0;

const hasPerfectSession = (sessions: SessionRecord[]): boolean =>
  sessions.some((s) => s.games.length > 0 && s.games.every((g) => g.accuracy >= 0.9));

const hasPerfectGame = (history: BadgeContext['gameHistory']): boolean => {
  for (const id in history) {
    const list = history[id as GameId];
    if (list && list.some((r) => r.accuracy >= 1.0)) return true;
  }
  return false;
};

// ── Badge definitions (25) ───────────────────────────────────────────────

export const BADGES: BadgeDef[] = [
  // Milestones
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first session.',
    icon: '🌱',
    category: 'milestone',
    check: (c) => c.totalSessions >= 1,
  },
  {
    id: 'devoted',
    name: 'Devoted',
    description: 'Complete 50 sessions.',
    icon: '💫',
    category: 'milestone',
    check: (c) => c.totalSessions >= 50,
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Complete 100 sessions.',
    icon: '🎖️',
    category: 'milestone',
    check: (c) => c.totalSessions >= 100,
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Complete 365 sessions.',
    icon: '👑',
    category: 'milestone',
    check: (c) => c.totalSessions >= 365,
  },

  // Streaks
  {
    id: 'streak-starter',
    name: 'Streak Starter',
    description: 'Reach a 3-day streak.',
    icon: '🔥',
    category: 'streak',
    check: (c) => c.longestStreak >= 3,
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Reach a 7-day streak.',
    icon: '⚔️',
    category: 'streak',
    check: (c) => c.longestStreak >= 7,
  },
  {
    id: 'fortnight-force',
    name: 'Fortnight Force',
    description: 'Reach a 14-day streak.',
    icon: '⚡',
    category: 'streak',
    check: (c) => c.longestStreak >= 14,
  },
  {
    id: 'monthly-master',
    name: 'Monthly Master',
    description: 'Reach a 30-day streak.',
    icon: '🌙',
    category: 'streak',
    check: (c) => c.longestStreak >= 30,
  },
  {
    id: 'century-club',
    name: 'Century Club',
    description: 'Reach a 100-day streak.',
    icon: '💯',
    category: 'streak',
    check: (c) => c.longestStreak >= 100,
  },

  // Mastery
  {
    id: 'perfect-game',
    name: 'Perfect Game',
    description: '100% accuracy in any single game.',
    icon: '🎯',
    category: 'mastery',
    check: (c) => hasPerfectGame(c.gameHistory),
  },
  {
    id: 'perfect-session',
    name: 'Perfect Session',
    description: '90%+ accuracy in every game of a session.',
    icon: '✨',
    category: 'mastery',
    check: (c) => hasPerfectSession(c.sessions),
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Crush a Chain Reaction session in record time.',
    icon: '⚡',
    category: 'mastery',
    // Requires per-game duration tracking — placeholder until that lands.
    check: () => false,
  },
  {
    id: 'word-wizard',
    name: 'Word Wizard',
    description: 'Find a 7+ letter word in Word Weave.',
    icon: '📚',
    category: 'mastery',
    // Requires word-length tracking in word-weave results — placeholder.
    check: () => false,
  },
  {
    id: 'iron-will',
    name: 'Iron Will',
    description: 'Resist 20 red shapes in a row in Pulse.',
    icon: '🛡️',
    category: 'mastery',
    // Requires inner-game streak tracking — placeholder.
    check: () => false,
  },
  {
    id: 'memory-palace',
    name: 'Memory Palace',
    description: 'Remember 8+ items in a Ghost Kitchen round.',
    icon: '🧠',
    category: 'mastery',
    // Requires per-round item count — placeholder.
    check: () => false,
  },
  {
    id: 'zen-master',
    name: 'Zen Master',
    description: 'Complete 20 Zen Flow sessions.',
    icon: '🌊',
    category: 'mastery',
    check: (c) => sessionsOfGame(c.gameHistory, 'zen-flow') >= 20,
  },

  // Exploration
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Play all 11 games at least once.',
    icon: '🧭',
    category: 'exploration',
    check: (c) => allGamesPlayed(c.gameHistory),
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Train before 8 AM.',
    icon: '🌅',
    category: 'exploration',
    check: (c) => c.sessions.some((s) => sessionHour(s) < 8),
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Train after 10 PM.',
    icon: '🌙',
    category: 'exploration',
    check: (c) => c.sessions.some((s) => sessionHour(s) >= 22),
  },
  {
    id: 'grove-keeper',
    name: 'Grove Keeper',
    description: 'Grow all 5 grove zones to stage 6+.',
    icon: '🌳',
    category: 'exploration',
    check: (c) => c.groveZonesAtStage6Plus >= 5,
  },

  // Special
  {
    id: 'coin-collector',
    name: 'Coin Collector',
    description: 'Earn 5,000 lifetime coins.',
    icon: '🪙',
    category: 'special',
    check: (c) => c.totalCoinsEarned >= 5000,
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Win 5 friend challenges.',
    icon: '🦋',
    category: 'special',
    check: (c) => c.friendChallengesCompleted >= 5,
  },
  {
    id: 'real-world',
    name: 'Real World',
    description: 'Complete 10 real-life challenges.',
    icon: '🌍',
    category: 'special',
    check: (c) => c.realChallengesCompleted >= 10,
  },
  {
    id: 'comeback-kid',
    name: 'Comeback Kid',
    description: 'Return after 7+ days away.',
    icon: '🔄',
    category: 'special',
    // Requires gap detection — placeholder.
    check: () => false,
  },
  {
    id: 'founding-member',
    name: 'Founding Member',
    description: 'Among the first 1,000 users.',
    icon: '🌟',
    category: 'special',
    check: (c) => c.isFoundingMember,
  },
];

/** Look up a badge by id. */
export function getBadge(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}
