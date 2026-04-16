import type { KovaEmotion as KovaVisualEmotion, KovaStage } from '../components/kova/KovaStates';
import type { KovaEmotion as KovaStoreEmotion } from '../stores/kovaStore';

// Two KovaEmotion unions exist (kovaStore emits 7; KovaStates renders 12).
// This bridges the store's runtime emotions onto the component's visual set
// so downstream UI never receives an unrecognized label.
export const STORE_EMOTION_TO_VISUAL: Record<KovaStoreEmotion, KovaVisualEmotion> = {
  happy: 'happy',
  excited: 'excited',
  proud: 'proud',
  idle: 'idle',
  lonely: 'worried',
  sad: 'wilted',
  recovering: 'relieved',
};

export function clampStage(n: number): KovaStage {
  return (Math.min(7, Math.max(1, Math.round(n))) as KovaStage);
}
