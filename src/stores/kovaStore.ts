import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDateStr, isToday, isYesterday, daysSince } from '../utils/timeUtils';

// ── Kova Evolution Stages ────────────────────────────────────

export interface KovaStageConfig {
  id: number;
  name: string;
  requiredStreak: number;
  glowIntensity: number;
  size: number;
  primaryColor: string;
  secondaryColor: string;
  description: string;
  unlockedAnimations: string[];
}

export const KOVA_STAGES: KovaStageConfig[] = [
  {
    id: 1, name: 'Spark', requiredStreak: 0,
    glowIntensity: 0.15, size: 0.7,
    primaryColor: '#6ECF9A', secondaryColor: '#3A7A5A',
    description: 'A faint glow stirs in the deep...',
    unlockedAnimations: ['idle', 'blink'],
  },
  {
    id: 2, name: 'Ember', requiredStreak: 3,
    glowIntensity: 0.3, size: 0.8,
    primaryColor: '#6ECF9A', secondaryColor: '#4A9A6E',
    description: 'Kova awakens, curious and small.',
    unlockedAnimations: ['idle', 'blink', 'bob'],
  },
  {
    id: 3, name: 'Glow', requiredStreak: 7,
    glowIntensity: 0.45, size: 0.9,
    primaryColor: '#6BA8E0', secondaryColor: '#3A6A90',
    description: 'Light blooms. Kova grows stronger.',
    unlockedAnimations: ['idle', 'blink', 'bob', 'sparkle'],
  },
  {
    id: 4, name: 'Pulse', requiredStreak: 14,
    glowIntensity: 0.6, size: 1.0,
    primaryColor: '#9B72E0', secondaryColor: '#5A3A90',
    description: 'A steady pulse of energy. Kova thrives.',
    unlockedAnimations: ['idle', 'blink', 'bob', 'sparkle', 'pulse'],
  },
  {
    id: 5, name: 'Radiant', requiredStreak: 30,
    glowIntensity: 0.75, size: 1.1,
    primaryColor: '#F0B542', secondaryColor: '#A07A2A',
    description: 'Kova radiates brilliance.',
    unlockedAnimations: ['idle', 'blink', 'bob', 'sparkle', 'pulse', 'radiate'],
  },
  {
    id: 6, name: 'Luminous', requiredStreak: 60,
    glowIntensity: 0.9, size: 1.2,
    primaryColor: '#E09B6B', secondaryColor: '#A06A3A',
    description: 'Ancient light flows through Kova.',
    unlockedAnimations: ['idle', 'blink', 'bob', 'sparkle', 'pulse', 'radiate', 'luminous'],
  },
  {
    id: 7, name: 'Transcendent', requiredStreak: 100,
    glowIntensity: 1.0, size: 1.3,
    primaryColor: '#FFFFFF', secondaryColor: '#E0D0FF',
    description: 'Kova has become something extraordinary.',
    unlockedAnimations: ['idle', 'blink', 'bob', 'sparkle', 'pulse', 'radiate', 'luminous', 'transcend'],
  },
];

export function stageConfigFor(stageId: number): KovaStageConfig {
  return KOVA_STAGES[Math.max(0, Math.min(stageId - 1, KOVA_STAGES.length - 1))];
}

export function stageForStreak(streak: number): number {
  let stage = 1;
  for (const s of KOVA_STAGES) {
    if (streak >= s.requiredStreak) stage = s.id;
  }
  return stage;
}

// ── Kova Emotions ────────────────────────────────────────────

export type KovaEmotion =
  | 'happy'
  | 'excited'
  | 'proud'
  | 'idle'
  | 'lonely'
  | 'sad'
  | 'recovering';

// ── Kova Dialogue ────────────────────────────────────────────

export const KOVA_DIALOGUE: Record<KovaEmotion, string[]> = {
  happy: [
    "You came back! My glow got brighter just now ✨",
    "Another day together. I can feel myself growing!",
    "Hey you! Ready to light up some neurons?",
    "I saved your favorite spot. Let's go!",
    "My particles are tingling. Must be training time!",
  ],
  idle: [
    "I've been waiting for you... got some challenges ready!",
    "Psst... today's challenges look fun 👀",
    "I practiced my glow while you were away. Wanna see?",
    "The challenges expire soon... just saying 💫",
  ],
  lonely: [
    "It's getting a little dim in here...",
    "I'm still here! Just... flickering a bit.",
    "Your challenges are almost gone for today 🥺",
    "I miss the sparkles we make together...",
  ],
  sad: [
    "You were gone for a while... I dimmed a little.",
    "I lost some of my glow, but I'm glad you're back.",
    "It's okay. We can rebuild the light together.",
    "I flickered, but I didn't go out. I waited for you.",
  ],
  excited: [
    "WOAH! Look what you got! ✨✨✨",
    "That was AMAZING! My particles are going wild!",
    "You're on fire! Well, I'm on fire. Bioluminescent fire!",
    "Keep going keep going keep going!!! 🔥",
  ],
  proud: [
    "I can feel it... I'm EVOLVING!",
    "Something incredible is happening... ✨",
    "We did this together. Look at me now!",
    "I've never glowed this bright before!",
  ],
  recovering: [
    "Every glow starts with a single spark.",
    "We're rebuilding. One challenge at a time.",
    "I can feel the warmth returning already...",
    "You showed up. That's what matters most.",
  ],
};

export function pickDialogue(emotion: KovaEmotion): string {
  const lines = KOVA_DIALOGUE[emotion];
  return lines[Math.floor(Math.random() * lines.length)];
}

// ── Kova Cosmetics ───────────────────────────────────────────

export interface KovaCosmetic {
  id: string;
  name: string;
  type: 'aura' | 'particle_color' | 'trail' | 'hat';
  color?: string;
  description: string;
}

// ── Store ────────────────────────────────────────────────────

interface KovaStoreState {
  currentStage: number;
  currentEmotion: KovaEmotion;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  totalDaysPlayed: number;
  unlockedCosmetics: string[];
  equippedCosmetic: string | null;

  // Pending events (consumed by UI once)
  pendingEvolution: number | null;      // stage ID to animate TO
  pendingDeEvolution: number | null;    // stage ID to animate TO

  /** Call on every app open to evaluate streak state. */
  evaluateOnOpen: () => void;

  /** Call when user completes a challenge today. */
  recordChallengeCompletion: () => {
    evolved: boolean;
    newStage: number;
  };

  /** Clear the pending evolution/de-evolution after animation plays. */
  clearPendingEvolution: () => void;

  /** Add a cosmetic to the collection. */
  addCosmetic: (cosmeticId: string) => void;

  /** Equip a cosmetic. */
  equipCosmetic: (cosmeticId: string | null) => void;

  /** Set emotion manually (e.g. from reward reveal). */
  setEmotion: (emotion: KovaEmotion) => void;
}

export const useKovaStore = create<KovaStoreState>()(
  persist(
    (set, get) => ({
      currentStage: 1,
      currentEmotion: 'idle' as KovaEmotion,
      currentStreak: 0,
      longestStreak: 0,
      lastPlayedDate: null,
      totalDaysPlayed: 0,
      unlockedCosmetics: [],
      equippedCosmetic: null,
      pendingEvolution: null,
      pendingDeEvolution: null,

      evaluateOnOpen: () => {
        const { lastPlayedDate, currentStage, currentEmotion } = get();

        if (isToday(lastPlayedDate)) {
          if (currentEmotion !== 'happy') set({ currentEmotion: 'happy' });
          return;
        }

        if (isYesterday(lastPlayedDate)) {
          if (currentEmotion !== 'idle') set({ currentEmotion: 'idle' });
          return;
        }

        if (lastPlayedDate !== null && daysSince(lastPlayedDate) >= 2) {
          const newStage = Math.max(1, currentStage - 1);
          set({
            currentStreak: 0,
            currentStage: newStage,
            currentEmotion: 'sad',
            pendingDeEvolution: currentStage !== newStage ? newStage : null,
          });
          return;
        }

        if (currentEmotion !== 'idle') set({ currentEmotion: 'idle' });
      },

      recordChallengeCompletion: () => {
        const { lastPlayedDate, currentStreak, longestStreak, totalDaysPlayed, currentStage } = get();
        const today = localDateStr();

        // Already played today — don't double-count
        if (isToday(lastPlayedDate)) {
          return { evolved: false, newStage: currentStage };
        }

        const newStreak = currentStreak + 1;
        const newLongest = Math.max(longestStreak, newStreak);
        const targetStage = stageForStreak(newStreak);
        const evolved = targetStage > currentStage;

        set({
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastPlayedDate: today,
          totalDaysPlayed: totalDaysPlayed + 1,
          currentStage: targetStage,
          currentEmotion: evolved ? 'proud' : 'happy',
          pendingEvolution: evolved ? targetStage : null,
        });

        return { evolved, newStage: targetStage };
      },

      clearPendingEvolution: () => {
        set({ pendingEvolution: null, pendingDeEvolution: null });
      },

      addCosmetic: (cosmeticId) => {
        const { unlockedCosmetics } = get();
        if (unlockedCosmetics.includes(cosmeticId)) return;
        set({ unlockedCosmetics: [...unlockedCosmetics, cosmeticId] });
      },

      equipCosmetic: (cosmeticId) => {
        set({ equippedCosmetic: cosmeticId });
      },

      setEmotion: (emotion) => {
        set({ currentEmotion: emotion });
      },
    }),
    {
      name: 'neurra-kova',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentStage: state.currentStage,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        lastPlayedDate: state.lastPlayedDate,
        totalDaysPlayed: state.totalDaysPlayed,
        unlockedCosmetics: state.unlockedCosmetics,
        equippedCosmetic: state.equippedCosmetic,
      }),
    },
  ),
);
