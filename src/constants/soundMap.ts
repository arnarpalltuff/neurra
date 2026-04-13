import { AVPlaybackSource } from 'expo-av';

/**
 * Sound registry — typed names with volume categories.
 *
 * To activate sounds:
 * 1. Drop MP3 files into the corresponding assets/sounds/ subdirectory
 * 2. Uncomment the matching require() line below
 * 3. Reload the app — sounds auto-preload on launch
 *
 * Missing files are skipped silently. The app never crashes from sound issues.
 */

export type SoundCategory = 'ui' | 'gameplay' | 'rewards' | 'kova';

export const CATEGORY_VOLUME: Record<SoundCategory, number> = {
  ui: 0.5,
  gameplay: 0.8,
  rewards: 1.0,
  kova: 0.7,
};

export type SoundName =
  // UI (0.5 volume)
  | 'tap'
  | 'back'
  | 'transition'
  | 'modalOpen'
  // Gameplay (0.8 volume)
  | 'correct'
  | 'wrong'
  | 'comboHit'
  | 'timerTick'
  | 'timerWarning'
  | 'roundStart'
  | 'roundEnd'
  // Rewards (1.0 volume)
  | 'confetti'
  | 'levelUp'
  | 'streak'
  | 'perfect'
  // Kova (0.7 volume)
  | 'kovaEncourage'
  | 'kovaCelebrate';

export interface SoundEntry {
  name: SoundName;
  category: SoundCategory;
  source: AVPlaybackSource | null;
}

/**
 * Sound registry. Uncomment require() lines as you add MP3 files.
 * Each entry maps a typed name to its file + volume category.
 */
export const SOUND_ENTRIES: SoundEntry[] = [
  // ── UI ────────────────────────────────────────────────
  // { name: 'tap',        category: 'ui', source: require('../../assets/sounds/ui/tap.mp3') },
  // { name: 'back',       category: 'ui', source: require('../../assets/sounds/ui/back.mp3') },
  // { name: 'transition', category: 'ui', source: require('../../assets/sounds/ui/transition.mp3') },
  // { name: 'modalOpen',  category: 'ui', source: require('../../assets/sounds/ui/modal-open.mp3') },

  // ── Gameplay ──────────────────────────────────────────
  // { name: 'correct',      category: 'gameplay', source: require('../../assets/sounds/gameplay/correct.mp3') },
  // { name: 'wrong',        category: 'gameplay', source: require('../../assets/sounds/gameplay/wrong.mp3') },
  // { name: 'comboHit',     category: 'gameplay', source: require('../../assets/sounds/gameplay/combo-hit.mp3') },
  // { name: 'timerTick',    category: 'gameplay', source: require('../../assets/sounds/gameplay/timer-tick.mp3') },
  // { name: 'timerWarning', category: 'gameplay', source: require('../../assets/sounds/gameplay/timer-warning.mp3') },
  // { name: 'roundStart',   category: 'gameplay', source: require('../../assets/sounds/gameplay/round-start.mp3') },
  // { name: 'roundEnd',     category: 'gameplay', source: require('../../assets/sounds/gameplay/round-end.mp3') },

  // ── Rewards ───────────────────────────────────────────
  // { name: 'confetti', category: 'rewards', source: require('../../assets/sounds/rewards/confetti.mp3') },
  // { name: 'levelUp',  category: 'rewards', source: require('../../assets/sounds/rewards/level-up.mp3') },
  // { name: 'streak',   category: 'rewards', source: require('../../assets/sounds/rewards/streak.mp3') },
  // { name: 'perfect',  category: 'rewards', source: require('../../assets/sounds/rewards/perfect.mp3') },

  // ── Kova ──────────────────────────────────────────────
  // { name: 'kovaEncourage', category: 'kova', source: require('../../assets/sounds/kova/encourage.mp3') },
  // { name: 'kovaCelebrate', category: 'kova', source: require('../../assets/sounds/kova/celebrate.mp3') },
];
