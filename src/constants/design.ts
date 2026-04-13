import { Easing } from 'react-native-reanimated';
import { C } from './colors';

/**
 * Neurra design tokens.
 *
 * These are the *new* tokens introduced during the anti-AI design overhaul.
 * Existing screens still use inline values; new and refactored screens should
 * pull spacing / radii / shadows / motion from here so the visual language
 * stays consistent.
 *
 * Principles:
 *   - Asymmetry over symmetry. Vary spacing values deliberately.
 *   - Dramatic type contrast (see typography.ts: heroNumber vs microLabel).
 *   - Sparse color. Most surfaces are neutral; accent colors are rare.
 *   - Layered shadows: every elevated surface gets two — a tight edge shadow
 *     and a soft depth shadow.
 *   - Organic motion: durations are randomized within a range, easings differ
 *     by purpose.
 */

/** Spacing — use these values, vary them deliberately, don't default to 16 everywhere. */
export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  massive: 60,
} as const;

/** Border radii — vary by element size. Don't use the same radius for everything. */
export const radii = {
  /** Small elements: pills, badges, tags. */
  sm: 8,
  /** Medium elements: stat cards, settings sections. */
  md: 14,
  /** Large cards: session card, game result cards. */
  lg: 20,
  /** Pill buttons (CTA). Combine with height/2 for a true pill. */
  pill: 26,
  /** Speech bubble main radius. Pair with bubbleTail for the corner near the speaker. */
  bubble: 16,
  /** Speech bubble tail-side corner — small, less round, like a real bubble. */
  bubbleTail: 4,
  /** Full circle — avatars, dots, icon backgrounds. */
  full: 9999,
} as const;

/**
 * Shadow tokens.
 *
 * For elevated cards, apply BOTH `shadowTight` and `shadowSoft` to a wrapper —
 * RN doesn't natively support multiple shadows on one View, so put one on the
 * wrapper and one on the inner View, OR pick `shadowSoft` alone for most cases
 * and let `shadowTight` define edges only on the most important surface.
 */
export const shadows = {
  /** Tight, close shadow. Defines the edge of a surface. */
  tight: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 } as const,
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  /** Soft, spread shadow. Creates depth. */
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 } as const,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  /** The most important card on the screen — the session CTA. Bigger than soft. */
  hero: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 } as const,
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 10,
  },
  /** Subtle — for stat cards and secondary surfaces. Less than soft. */
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 } as const,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

/** Glow shadow for accent elements — buttons, active indicators. */
export const accentGlow = (color: string, radius: number = 16, opacity: number = 0.35) =>
  ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 } as const,
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: 8,
  } as const);

/**
 * Motion presets.
 *
 * Use the right easing for the right purpose. Don't apply the same animation
 * to everything.
 */
export const motion = {
  /** Snappy press feedback. Buttons. */
  springSnappy: { damping: 15, stiffness: 200 } as const,
  /** Bouncy. Celebrations, particles. */
  springBouncy: { damping: 8, stiffness: 100 } as const,
  /** Soft entry. Modals, cards landing on screen. */
  springSoft: { damping: 18, stiffness: 140 } as const,

  /** Card entrance — smooth, elegant. */
  cardEnter: { duration: 500, easing: Easing.out(Easing.cubic) },
  /** Number count-up — starts fast, slows at end. Satisfying. */
  countUp: { duration: 1500, easing: Easing.out(Easing.quad) },
  /** Tab switch — quick, functional. */
  tabSwitch: { duration: 200, easing: Easing.inOut(Easing.ease) },
  /** Subtle UI fades. */
  fade: { duration: 300, easing: Easing.inOut(Easing.ease) },

  /** Stagger delay between siblings (cards, list items). */
  staggerStep: 80,
} as const;

/**
 * Randomized organic timing for things that should feel alive.
 *
 * Kova breathing must NEVER be exactly the same speed twice. Robots breathe
 * at exactly 3.000s. Living things breathe at 2.8, 3.1, 2.9...
 */
export const organic = {
  /** Kova breath cycle. 2600–3200ms. */
  breath: () => 2600 + Math.random() * 600,
  /** Idle micro-movements. 8–15s. */
  idleAction: () => 8000 + Math.random() * 7000,
  /** Ambient float. 4–8s. */
  ambientFloat: () => 4000 + Math.random() * 4000,
} as const;

/**
 * Asymmetry helpers.
 *
 * Most home/feature screens use a 24px horizontal page padding, but specific
 * elements should sit slightly off-center for visual tension. Don't default
 * to a single padding value for an entire screen.
 */
export const asymmetry = {
  /** Default page padding — applies to MOST elements but not all. */
  pagePadding: 24,
  /** Greeting sits at this left padding. */
  greetingLeft: 24,
  /** Streak counter sits at this right padding (offset from greeting baseline). */
  streakRight: 24,
  /** Vertical offset between greeting and streak so they aren't aligned. */
  streakDrop: 8,
  /** Session card horizontal margins — slightly off-center to the left. */
  sessionMarginLeft: 20,
  sessionMarginRight: 28,
} as const;

/** Stat card sizes — deliberately varied. The tallest draws the eye first. */
export const statCardSizes = [
  { width: 90, height: 88 },
  { width: 120, height: 104 },
  { width: 96, height: 92 },
] as const;

/** Game result card stagger margins (session summary). */
export const summaryStagger = [20, 32, 24] as const;

/** Pill button height matched to radius — true pill shape. */
export const pillButton = {
  height: 52,
  borderRadius: 26,
  paddingHorizontal: 32,
} as const;

/** Re-export C so callers can `import { C, space, radii } from '../constants/design'`. */
export { C };
