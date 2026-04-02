import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'neurra-rate-state';

interface RateState {
  hasRated: boolean;
  lastPromptDate: string | null;
}

async function getState(): Promise<RateState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { hasRated: false, lastPromptDate: null };
}

async function saveState(state: RateState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Check if ALL conditions are met to show the rate prompt:
 * - 15+ total sessions
 * - Current streak 5+ days
 * - Just had a session with 85%+ average accuracy
 * - Not prompted in last 60 days
 * - Has NOT already left a review
 */
export async function shouldShowRatePrompt(opts: {
  totalSessions: number;
  streak: number;
  sessionAccuracy: number; // 0-1
}): Promise<boolean> {
  if (opts.totalSessions < 15) return false;
  if (opts.streak < 5) return false;
  if (opts.sessionAccuracy < 0.85) return false;

  const state = await getState();
  if (state.hasRated) return false;

  if (state.lastPromptDate) {
    const last = new Date(state.lastPromptDate);
    const daysSince = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 60) return false;
  }

  return true;
}

/** Record that the prompt was shown (user tapped "Not now") */
export async function recordRatePromptShown(): Promise<void> {
  const state = await getState();
  state.lastPromptDate = new Date().toISOString().split('T')[0];
  await saveState(state);
}

/** Record that the user rated the app */
export async function recordRated(): Promise<void> {
  await saveState({ hasRated: true, lastPromptDate: null });
}
