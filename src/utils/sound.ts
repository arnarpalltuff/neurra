import { Audio, AVPlaybackSource } from 'expo-av';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Sound Design System — complete sound palette with pool-based playback.
 *
 * Sounds are categorized with distinct volume levels:
 * - UI: 60%
 * - Game feedback: 80%
 * - Celebrations: 100%
 * - Ambient: 30%
 *
 * All playback is fire-and-forget. Max 3 simultaneous sounds.
 */

// ── Volume tiers ────────────────────────────────────────────
const VOL_UI = 0.6;
const VOL_GAME = 0.8;
const VOL_CELEBRATION = 1.0;
const VOL_AMBIENT = 0.3;
const VOL_KOVA = 0.7;

// ── Concurrency limiter ─────────────────────────────────────
const MAX_CONCURRENT = 3;
const activePlays = new Set<number>();
let playIdCounter = 0;

// ── Settings checks ─────────────────────────────────────────
function isSoundEnabled(): boolean {
  return useSettingsStore.getState().soundEnabled;
}

function isMusicEnabled(): boolean {
  return useSettingsStore.getState().musicEnabled;
}

function getUserVolume(): number {
  return useSettingsStore.getState().volume;
}

// ── Sound Pool ──────────────────────────────────────────────
// Pre-loaded Audio.Sound instances keyed by name.
// In production, populate via preloadAllSounds() at app start.
const soundPool: Map<string, Audio.Sound> = new Map();

/**
 * Pre-load all sounds during splash. Call once at app start.
 * In production, pass actual require() sources for each sound file.
 */
export async function preloadAllSounds(): Promise<void> {
  // Configure audio session for background mixing
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });

  // In production, load each sound file here:
  // const sources: Record<string, AVPlaybackSource> = {
  //   tap: require('../../assets/sounds/tap.mp3'),
  //   toggle: require('../../assets/sounds/toggle.mp3'),
  //   swipe: require('../../assets/sounds/swipe.mp3'),
  //   back: require('../../assets/sounds/back.mp3'),
  //   correct: require('../../assets/sounds/correct.mp3'),
  //   correct_combo2: require('../../assets/sounds/correct_combo2.mp3'),
  //   correct_combo3: require('../../assets/sounds/correct_combo3.mp3'),
  //   correct_combo5: require('../../assets/sounds/correct_combo5.mp3'),
  //   correct_combo10: require('../../assets/sounds/correct_combo10.mp3'),
  //   wrong: require('../../assets/sounds/wrong.mp3'),
  //   round_complete: require('../../assets/sounds/round_complete.mp3'),
  //   game_complete: require('../../assets/sounds/game_complete.mp3'),
  //   xp_tick: require('../../assets/sounds/xp_tick.mp3'),
  //   xp_complete: require('../../assets/sounds/xp_complete.mp3'),
  //   coin_earn: require('../../assets/sounds/coin_earn.mp3'),
  //   coin_cascade: require('../../assets/sounds/coin_cascade.mp3'),
  //   chest_shake: require('../../assets/sounds/chest_shake.mp3'),
  //   chest_open: require('../../assets/sounds/chest_open.mp3'),
  //   rare_reveal: require('../../assets/sounds/rare_reveal.mp3'),
  //   mystery_orb: require('../../assets/sounds/mystery_orb.mp3'),
  //   streak_up: require('../../assets/sounds/streak_up.mp3'),
  //   level_up: require('../../assets/sounds/level_up.mp3'),
  //   league_promote: require('../../assets/sounds/league_promote.mp3'),
  //   kova_evolve: require('../../assets/sounds/kova_evolve.mp3'),
  //   personal_best: require('../../assets/sounds/personal_best.mp3'),
  //   perfect_score: require('../../assets/sounds/perfect_score.mp3'),
  //   confetti: require('../../assets/sounds/confetti.mp3'),
  //   kova_happy: require('../../assets/sounds/kova_happy.mp3'),
  //   kova_excited: require('../../assets/sounds/kova_excited.mp3'),
  //   kova_encourage: require('../../assets/sounds/kova_encourage.mp3'),
  //   kova_giggle: require('../../assets/sounds/kova_giggle.mp3'),
  //   kova_yawn: require('../../assets/sounds/kova_yawn.mp3'),
  //   kova_wow: require('../../assets/sounds/kova_wow.mp3'),
  //   grove_ambient: require('../../assets/sounds/grove_ambient.mp3'),
  //   session_ambient: require('../../assets/sounds/session_ambient.mp3'),
  // };
  //
  // for (const [name, source] of Object.entries(sources)) {
  //   try {
  //     const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: false });
  //     soundPool.set(name, sound);
  //   } catch (e) {
  //     console.warn(`Failed to preload sound: ${name}`, e);
  //   }
  // }
}

/**
 * Fire-and-forget sound playback from the pool.
 * Respects settings, volume tiers, and concurrency limits.
 */
function play(name: string, volumeTier: number): void {
  if (!isSoundEnabled()) return;
  if (activePlays.size >= MAX_CONCURRENT) return;

  const sound = soundPool.get(name);
  if (!sound) return; // Sound not loaded (or in dev mode)

  const finalVolume = volumeTier * getUserVolume();
  const playId = ++playIdCounter;
  activePlays.add(playId);

  sound
    .setPositionAsync(0)
    .then(() => sound.setVolumeAsync(finalVolume))
    .then(() => sound.playAsync())
    .catch(() => {})
    .finally(() => {
      // Release slot after estimated duration (sounds are short)
      setTimeout(() => { activePlays.delete(playId); }, 1500);
    });
}

// Ambient loop tracking
let ambientSound: Audio.Sound | null = null;

function playAmbientLoop(name: string): void {
  if (!isMusicEnabled()) return;
  const sound = soundPool.get(name);
  if (!sound) return;

  // Stop any currently playing ambient before starting a new one
  if (ambientSound && ambientSound !== sound) {
    ambientSound.stopAsync().catch(() => {});
  }
  ambientSound = sound;
  const vol = VOL_AMBIENT * getUserVolume();
  sound.setIsLoopingAsync(true)
    .then(() => sound.setVolumeAsync(vol))
    .then(() => sound.playAsync())
    .catch(() => {});
}

function stopAmbient(): void {
  if (ambientSound) {
    ambientSound.stopAsync().catch(() => {});
    ambientSound = null;
  }
}

// ── UI Sounds (60% volume) ──────────────────────────────────

/** Soft click, like tapping glass (50ms) */
export function playTap(): void {
  play('tap', VOL_UI);
}

/** Satisfying mechanical click (100ms) */
export function playToggle(): void {
  play('toggle', VOL_UI);
}

/** Soft whoosh (150ms) */
export function playSwipe(): void {
  play('swipe', VOL_UI);
}

/** Reverse whoosh, slightly lower pitch (150ms) */
export function playBack(): void {
  play('back', VOL_UI);
}

// ── Game Feedback (80% volume) ──────────────────────────────

/** Bright chime, C5 note (200ms) */
export function playCorrect(): void {
  play('correct', VOL_GAME);
}

/** Combo-aware correct: picks the right chime for the combo level */
export function playCorrectCombo(combo: number): void {
  if (combo >= 10) play('correct_combo10', VOL_GAME);
  else if (combo >= 5) play('correct_combo5', VOL_GAME);
  else if (combo >= 3) play('correct_combo3', VOL_GAME);
  else if (combo >= 2) play('correct_combo2', VOL_GAME);
  else play('correct', VOL_GAME);
}

/** Soft, low "bonk", wooden/muted (200ms) */
export function playWrong(): void {
  play('wrong', VOL_GAME);
}

/** Ascending two-note chime (300ms) */
export function playRoundComplete(): void {
  play('round_complete', VOL_GAME);
}

/** Warm resolution chord (800ms) */
export function playGameComplete(): void {
  play('game_complete', VOL_GAME);
}

// ── Reward Sounds (80% volume) ──────────────────────────────

/** Very short tick for counting animation (30ms) */
export function playXPTick(): void {
  play('xp_tick', VOL_UI);
}

/** Ding when counting finishes (200ms) */
export function playXPComplete(): void {
  play('xp_complete', VOL_GAME);
}

/** Metallic clink (150ms) */
export function playCoinEarned(): void {
  play('coin_earn', VOL_GAME);
}

/** Rapid sequence of clinks (500ms) */
export function playCoinCascade(): void {
  play('coin_cascade', VOL_GAME);
}

/** Rattling/jingling (300ms) */
export function playChestShake(): void {
  play('chest_shake', VOL_GAME);
}

/** Burst of sparkle + whoosh (500ms) */
export function playChestOpen(): void {
  play('chest_open', VOL_CELEBRATION);
}

/** Magical shimmer + choir note (800ms) */
export function playRareReveal(): void {
  play('rare_reveal', VOL_CELEBRATION);
}

/** Mysterious hum that builds (1000ms) */
export function playMysteryOrb(): void {
  play('mystery_orb', VOL_GAME);
}

// ── Celebration Sounds (100% volume) ────────────────────────

/** Whoosh + flame sound (400ms) */
export function playStreakMilestone(): void {
  play('streak_up', VOL_CELEBRATION);
}

/** Ascending scale + burst (1200ms) */
export function playLevelUp(): void {
  play('level_up', VOL_CELEBRATION);
}

/** Triumphant brass hit (1500ms) */
export function playLeaguePromote(): void {
  play('league_promote', VOL_CELEBRATION);
}

/** Chord builds and resolves (3000ms) */
export function playKovaEvolve(): void {
  play('kova_evolve', VOL_CELEBRATION);
}

/** Excited ascending notes + sparkle (800ms) */
export function playPersonalBest(): void {
  play('personal_best', VOL_CELEBRATION);
}

/** Angelic chord + sparkle rain (1500ms) */
export function playPerfectScore(): void {
  play('perfect_score', VOL_CELEBRATION);
}

/** Party popper + celebration (1000ms) */
export function playConfetti(): void {
  play('confetti', VOL_CELEBRATION);
}

// ── Kova Sounds (70% volume) ────────────────────────────────

/** Cute chirp (200ms) */
export function playKovaHappy(): void {
  play('kova_happy', VOL_KOVA);
}

/** Higher-pitched chirp sequence (400ms) */
export function playKovaExcited(): void {
  play('kova_excited', VOL_KOVA);
}

/** Soft, warm hum (300ms) */
export function playKovaEncourage(): void {
  play('kova_encourage', VOL_KOVA);
}

/** Tiny laugh (300ms) */
export function playKovaGiggle(): void {
  play('kova_giggle', VOL_KOVA);
}

/** Tiny yawn (500ms) */
export function playKovaYawn(): void {
  play('kova_yawn', VOL_KOVA);
}

/** Surprised exclamation (300ms) */
export function playKovaWow(): void {
  play('kova_wow', VOL_KOVA);
}

// ── Ambient (30% volume, looping) ───────────────────────────

/** Gentle nature loop — wind, distant birds, soft water */
export function startGroveAmbient(): void {
  playAmbientLoop('grove_ambient');
}

/** Very subtle background hum for sessions */
export function startSessionAmbient(): void {
  playAmbientLoop('session_ambient');
}

/** Stop any playing ambient sound */
export { stopAmbient };

// ── Legacy aliases (backward compatibility) ─────────────────
// These match the old API so existing call sites keep working.

/** @deprecated Use playStreakMilestone */
export function playSuccess(): void {
  // Was used for session complete — map to game_complete
  play('game_complete', VOL_CELEBRATION);
}

/** @deprecated Use playXPTick */
export function playTick(): void {
  play('xp_tick', VOL_UI);
}

/** @deprecated Use playKovaHappy */
export function playNotification(): void {
  play('kova_happy', VOL_KOVA);
}
