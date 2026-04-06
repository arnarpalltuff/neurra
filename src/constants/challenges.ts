/**
 * Real-Life Challenges — practical cognitive tests using real-world scenarios.
 *
 * Offered after every 3rd session as optional bonus content.
 * Tests the same skills as games but in everyday contexts.
 */

export type ChallengeType = 'memory' | 'focus' | 'speed';

export interface ChallengeItem {
  id: string;
  type: ChallengeType;
  subtype: string;
  title: string;
  description: string;
  icon: string;
  difficulty: 1 | 2 | 3;
  estimatedTime: number; // seconds
  realWorldFraming: string;
  storyFraming?: string; // used when story mode is ON
}

export interface GroceryChallenge extends ChallengeItem {
  subtype: 'grocery_list';
  items: string[];
  displayDuration: number; // ms
}

export interface PhoneNumberChallenge extends ChallengeItem {
  subtype: 'phone_number';
  number: string;
  displayDuration: number; // ms
}

export interface DirectionsChallenge extends ChallengeItem {
  subtype: 'directions';
  steps: string[];
  displayDuration: number; // ms
}

export type Challenge = GroceryChallenge | PhoneNumberChallenge | DirectionsChallenge;

// ── Grocery List Challenges ─────────────────────────

const GROCERY_EASY: GroceryChallenge = {
  id: 'grocery-easy',
  type: 'memory',
  subtype: 'grocery_list',
  title: 'The Grocery List',
  description: 'Memorize this shopping list. No peeking.',
  icon: '🛒',
  difficulty: 1,
  estimatedTime: 30,
  realWorldFraming: "You just memorized a shopping trip without writing anything down.",
  storyFraming: "Kova found an old supply cache. Can you remember what's inside?",
  items: ['Milk', 'Eggs', 'Bananas', 'Bread', 'Olive Oil'],
  displayDuration: 10000,
};

const GROCERY_MEDIUM: GroceryChallenge = {
  id: 'grocery-medium',
  type: 'memory',
  subtype: 'grocery_list',
  title: 'The Grocery List',
  description: 'A bigger list this time. Focus and memorize.',
  icon: '🛒',
  difficulty: 2,
  estimatedTime: 45,
  realWorldFraming: "You remembered 8 items without a list. That's a real skill.",
  storyFraming: "The supply cache is larger than expected. Remember everything.",
  items: ['Milk', 'Eggs', 'Bananas', 'Bread', 'Olive Oil', 'Chicken', 'Rice', 'Tomatoes'],
  displayDuration: 15000,
};

const GROCERY_HARD: GroceryChallenge = {
  id: 'grocery-hard',
  type: 'memory',
  subtype: 'grocery_list',
  title: 'The Grocery List',
  description: 'Full weekly shop. This is the real test.',
  icon: '🛒',
  difficulty: 3,
  estimatedTime: 60,
  realWorldFraming: "12 items memorized. That's a full week's shopping without a list.",
  storyFraming: "A massive cache — enough supplies for the whole Shimmer.",
  items: ['Milk', 'Eggs', 'Bananas', 'Bread', 'Olive Oil', 'Chicken', 'Rice', 'Tomatoes', 'Onions', 'Garlic', 'Butter', 'Pasta'],
  displayDuration: 15000,
};

// ── Phone Number Challenges ─────────────────────────

const PHONE_EASY: PhoneNumberChallenge = {
  id: 'phone-easy',
  type: 'memory',
  subtype: 'phone_number',
  title: 'The Phone Number',
  description: 'Memorize this number. You have a few seconds.',
  icon: '📱',
  difficulty: 1,
  estimatedTime: 20,
  realWorldFraming: "You held a phone number in your head long enough to dial it.",
  storyFraming: "A frequency code appeared on the Beacon. Remember it.",
  number: '5551234',
  displayDuration: 7000,
};

const PHONE_MEDIUM: PhoneNumberChallenge = {
  id: 'phone-medium',
  type: 'memory',
  subtype: 'phone_number',
  title: 'The Phone Number',
  description: 'Longer number, same focus.',
  icon: '📱',
  difficulty: 2,
  estimatedTime: 25,
  realWorldFraming: "You memorized a full phone number. No note needed.",
  storyFraming: "The Beacon frequency is more complex this time.",
  number: '555012789',
  displayDuration: 7000,
};

const PHONE_HARD: PhoneNumberChallenge = {
  id: 'phone-hard',
  type: 'memory',
  subtype: 'phone_number',
  title: 'The Phone Number',
  description: 'Full 10-digit number. Ready?',
  icon: '📱',
  difficulty: 3,
  estimatedTime: 30,
  realWorldFraming: "10 digits, pure memory. Your brain is sharper than you think.",
  storyFraming: "A 10-symbol Beacon code. The most complex yet.",
  number: '5550127894',
  displayDuration: 6000,
};

// ── Directions Challenges ───────────────────────────

const DIRECTIONS_EASY: DirectionsChallenge = {
  id: 'directions-easy',
  type: 'memory',
  subtype: 'directions',
  title: 'Follow the Route',
  description: 'Memorize these directions.',
  icon: '🗺️',
  difficulty: 1,
  estimatedTime: 30,
  realWorldFraming: "You followed directions without checking your phone once.",
  storyFraming: "The path forward splits. Memorize the route.",
  steps: ['Left on Oak St', 'Right on Main', 'Straight for 2 blocks'],
  displayDuration: 10000,
};

const DIRECTIONS_MEDIUM: DirectionsChallenge = {
  id: 'directions-medium',
  type: 'memory',
  subtype: 'directions',
  title: 'Follow the Route',
  description: 'More turns this time. Stay sharp.',
  icon: '🗺️',
  difficulty: 2,
  estimatedTime: 40,
  realWorldFraming: "5 turns from memory. You navigated like a local.",
  storyFraming: "A longer path through The Shimmer. Remember every turn.",
  steps: ['Left on Oak St', 'Right on Main', '2nd left on Park Ave', 'Right at the fountain', 'Left on Elm'],
  displayDuration: 15000,
};

const DIRECTIONS_HARD: DirectionsChallenge = {
  id: 'directions-hard',
  type: 'memory',
  subtype: 'directions',
  title: 'Follow the Route',
  description: 'Complex route. Full concentration.',
  icon: '🗺️',
  difficulty: 3,
  estimatedTime: 50,
  realWorldFraming: "You navigated a complex route from pure memory. Impressive.",
  storyFraming: "The deepest path yet. Miss a turn and The Fade closes in.",
  steps: ['Left on Oak St', 'Right on Main', '2nd left on Park Ave', 'Right at the fountain', 'Straight past the library', 'Left on Cedar Ln'],
  displayDuration: 18000,
};

// ── All challenges grouped by difficulty ────────────

export const ALL_CHALLENGES: Challenge[] = [
  GROCERY_EASY, GROCERY_MEDIUM, GROCERY_HARD,
  PHONE_EASY, PHONE_MEDIUM, PHONE_HARD,
  DIRECTIONS_EASY, DIRECTIONS_MEDIUM, DIRECTIONS_HARD,
];

/**
 * Pick a challenge based on player's weakest brain area and session count.
 */
export function pickChallenge(totalSessions: number): Challenge {
  // Difficulty escalates with total sessions
  const difficulty: 1 | 2 | 3 = totalSessions < 15 ? 1 : totalSessions < 40 ? 2 : 3;

  const pool = ALL_CHALLENGES.filter(c => c.difficulty === difficulty);
  return pool[totalSessions % pool.length];
}

/**
 * Should a real-life challenge be offered after this session?
 */
export function shouldOfferChallenge(totalSessions: number): boolean {
  return totalSessions > 0 && totalSessions % 3 === 0;
}

export const CHALLENGE_XP_BONUS = 100;
