import { Audio } from 'expo-av';
import { useSettingsStore } from '../stores/settingsStore';
import {
  SoundName, SoundEntry, SOUND_ENTRIES, CATEGORY_VOLUME,
} from '../constants/soundMap';

/**
 * Sound system — pool-based preloading with fire-and-forget playback.
 *
 * How it works:
 * 1. preloadAllSounds() runs at app start (called in _layout.tsx)
 * 2. It loads every uncommented entry in soundMap.ts into a pool
 * 3. playSound('correct') plays from the pool — instant, no latency
 * 4. Missing/failed sounds are skipped silently — app never crashes
 *
 * To add sounds: drop MP3s in assets/sounds/, uncomment the require()
 * line in soundMap.ts, reload the app. That's it.
 */

// ── Pool ────────────────────────────────────────────────
const pool: Map<SoundName, { sound: Audio.Sound; volume: number }> = new Map();
const MAX_CONCURRENT = 4;
const activePlays = new Set<number>();
let playId = 0;

// ── Settings ────────────────────────────────────────────
function isSoundEnabled(): boolean {
  return useSettingsStore.getState().soundEnabled;
}

function getUserVolume(): number {
  return useSettingsStore.getState().volume;
}

// ── Preloader ───────────────────────────────────────────

/**
 * Preload all registered sounds. Call once at app start.
 * Non-blocking — failures are logged, never thrown.
 */
export async function preloadAllSounds(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (e) {
    console.warn('[Sound] Failed to set audio mode:', e);
  }

  const entries = SOUND_ENTRIES.filter(e => e.source);
  const results = await Promise.allSettled(
    entries.map(async (entry) => {
      const { sound } = await Audio.Sound.createAsync(entry.source!, { shouldPlay: false });
      return { entry, sound };
    }),
  );
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { entry, sound } = result.value;
      pool.set(entry.name, { sound, volume: CATEGORY_VOLUME[entry.category] });
    } else {
      console.warn('[Sound] Failed to preload:', result.reason);
    }
  }
}

// ── Playback ────────────────────────────────────────────

/**
 * Fire-and-forget sound playback.
 * Respects sound enabled setting, volume, and concurrency limit.
 */
export function playSound(name: SoundName): void {
  if (!isSoundEnabled()) return;
  if (activePlays.size >= MAX_CONCURRENT) return;

  const entry = pool.get(name);
  if (!entry) return;

  const finalVolume = entry.volume * getUserVolume();
  const id = ++playId;
  activePlays.add(id);

  entry.sound
    .setPositionAsync(0)
    .then(() => entry.sound.setVolumeAsync(finalVolume))
    .then(() => entry.sound.playAsync())
    .catch(() => {})
    .finally(() => {
      setTimeout(() => activePlays.delete(id), 1500);
    });
}

/**
 * Rapid-fire variant — uses replayAsync to prevent overlap issues.
 * Best for: timer ticks, combo hits, tap feedback.
 */
export function playSoundFast(name: SoundName): void {
  if (!isSoundEnabled()) return;

  const entry = pool.get(name);
  if (!entry) return;

  const finalVolume = entry.volume * getUserVolume();
  entry.sound
    .setVolumeAsync(finalVolume)
    .then(() => entry.sound.replayAsync())
    .catch(() => {});
}

// ── Convenience wrappers ────────────────────────────────
// These match the trigger points in the codebase.
// Each is a one-liner so call sites stay clean.

// UI
export function playTap(): void { playSound('tap'); }
export function playBack(): void { playSound('back'); }
export function playTransition(): void { playSound('transition'); }
export function playModalOpen(): void { playSound('modalOpen'); }

// Gameplay
export function playCorrect(): void { playSound('correct'); }
export function playWrong(): void { playSound('wrong'); }
export function playComboHit(): void { playSound('comboHit'); }
export function playTimerTick(): void { playSoundFast('timerTick'); }
export function playTimerWarning(): void { playSoundFast('timerWarning'); }
export function playRoundStart(): void { playSound('roundStart'); }
export function playRoundEnd(): void { playSound('roundEnd'); }

// Rewards
export function playConfetti(): void { playSound('confetti'); }
export function playLevelUp(): void { playSound('levelUp'); }
export function playStreak(): void { playSound('streak'); }
export function playPerfect(): void { playSound('perfect'); }

// Kova
export function playKovaEncourage(): void { playSound('kovaEncourage'); }
export function playKovaCelebrate(): void { playSound('kovaCelebrate'); }

// ── Legacy aliases (backward compatibility) ─────────────
// Existing call sites use these names. Map them to the new system.
export function playSuccess(): void { playSound('roundEnd'); }
export function playTick(): void { playSoundFast('timerTick'); }
export function playNotification(): void { playSound('kovaEncourage'); }
export function playCorrectCombo(combo: number): void {
  if (combo >= 5) playSound('comboHit');
  else playSound('correct');
}
export function playGameComplete(): void { playSound('roundEnd'); }
export function playPersonalBest(): void { playSound('perfect'); }
export function playStreakMilestone(): void { playSound('streak'); }
export function playCoinEarned(): void { playSound('correct'); }
export function playCoinCascade(): void { playSound('confetti'); }
export function playChestShake(): void { playSound('tap'); }
export function playChestOpen(): void { playSound('confetti'); }
export function playRareReveal(): void { playSound('perfect'); }
export function playMysteryOrb(): void { playSound('modalOpen'); }
export function playXPTick(): void { playSoundFast('timerTick'); }
export function playXPComplete(): void { playSound('levelUp'); }
export function playKovaHappy(): void { playSound('kovaCelebrate'); }
export function playKovaExcited(): void { playSound('kovaCelebrate'); }
export function playKovaGiggle(): void { playSound('kovaEncourage'); }
export function playKovaYawn(): void { playSound('kovaEncourage'); }
export function playKovaWow(): void { playSound('kovaCelebrate'); }

export function playToggle(): void { playSound('tap'); }
export function playSwipe(): void { playSound('transition'); }
export function playPerfectScore(): void { playSound('perfect'); }

// Ambient (no-op until ambient system is needed)
export function startGroveAmbient(): void {}
export function startSessionAmbient(): void {}
export function stopAmbient(): void {}
