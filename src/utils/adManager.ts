import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayStr } from './timeUtils';

// ── Ad Placement Rules (Non-negotiable) ────────────────
//
// WHERE ads appear:
//   - Banner at bottom of session summary (after games, not during)
//   - Rewarded video to unlock daily bonus round
//   - Rewarded video to earn 15 coins (max 3 per day)
//
// WHERE ads NEVER appear:
//   - During games, home screen, grove, onboarding, as interstitials,
//     as pre-rolls, in notifications — NEVER
//
// FREQUENCY limits:
//   - Max 3 banner impressions per day
//   - Max 4 rewarded ads per day (1 bonus round + 3 coin rewards)

const STORAGE_KEY = 'neurra-ad-state';

interface AdState {
  date: string;
  bannerImpressions: number;
  rewardedAdsShown: number;
  coinRewardsCollected: number;
  bonusRoundUnlocked: boolean;
  lastAdTimestamp: number; // ms since epoch
  adFeedback: Array<{ timestamp: number; reason: string }>;
}

// Minimum 3 minutes between any ad impressions
const AD_COOLDOWN_MS = 3 * 60 * 1000;

function defaultState(): AdState {
  return {
    date: todayStr(),
    bannerImpressions: 0,
    rewardedAdsShown: 0,
    coinRewardsCollected: 0,
    bonusRoundUnlocked: false,
    lastAdTimestamp: 0,
    adFeedback: [],
  };
}

let cachedState: AdState | null = null;

async function getState(): Promise<AdState> {
  const today = todayStr();
  if (cachedState && cachedState.date === today) return cachedState;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: AdState = JSON.parse(raw);
      if (parsed.date === today) {
        cachedState = parsed;
        return parsed;
      }
    }
  } catch {}
  cachedState = defaultState();
  return cachedState;
}

async function saveState(state: AdState): Promise<void> {
  cachedState = state;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ── Public API ─────────────────────────────────────────

function cooldownActive(state: AdState): boolean {
  return Date.now() - state.lastAdTimestamp < AD_COOLDOWN_MS;
}

/**
 * Can we show a banner ad on the session summary?
 * Respects daily limits, cooldown, and session context.
 */
export async function canShowBanner(sessionAccuracy?: number): Promise<boolean> {
  const state = await getState();
  // Daily limit
  if (state.bannerImpressions >= 3) return false;
  // Cooldown
  if (cooldownActive(state)) return false;
  // Don't show ads after frustrating sessions (accuracy < 40%)
  if (sessionAccuracy !== undefined && sessionAccuracy < 0.4) return false;
  return true;
}

/** Record a banner impression */
export async function recordBannerImpression(): Promise<void> {
  const state = await getState();
  state.bannerImpressions += 1;
  state.lastAdTimestamp = Date.now();
  await saveState(state);
}

/** Can the user watch a rewarded ad for the bonus round? */
export async function canShowBonusRoundAd(): Promise<boolean> {
  const state = await getState();
  if (state.bonusRoundUnlocked || state.rewardedAdsShown >= 4) return false;
  if (cooldownActive(state)) return false;
  return true;
}

/** Record bonus round ad watched */
export async function recordBonusRoundAd(): Promise<void> {
  const state = await getState();
  state.bonusRoundUnlocked = true;
  state.rewardedAdsShown += 1;
  state.lastAdTimestamp = Date.now();
  await saveState(state);
}

/** How many coin reward ads remain today? */
export async function coinRewardAdsRemaining(): Promise<number> {
  const state = await getState();
  return Math.max(0, 3 - state.coinRewardsCollected);
}

/** Can the user watch a rewarded ad for coins? */
export async function canShowCoinRewardAd(): Promise<boolean> {
  const state = await getState();
  if (state.coinRewardsCollected >= 3 || state.rewardedAdsShown >= 4) return false;
  if (cooldownActive(state)) return false;
  return true;
}

/** Record coin reward ad watched */
export async function recordCoinRewardAd(): Promise<void> {
  const state = await getState();
  state.coinRewardsCollected += 1;
  state.rewardedAdsShown += 1;
  state.lastAdTimestamp = Date.now();
  await saveState(state);
}

/** Was the bonus round already unlocked today (via ad or free weekly)? */
export async function isBonusUnlocked(): Promise<boolean> {
  const state = await getState();
  return state.bonusRoundUnlocked;
}

/** Grant a free bonus unlock (1 per week fallback if ad fails to load) */
export async function grantFreeBonusUnlock(): Promise<void> {
  const state = await getState();
  state.bonusRoundUnlocked = true;
  await saveState(state);
}

/**
 * Should ads be suppressed for streak milestones?
 * No ads on milestone days — let the celebration breathe.
 */
export function shouldSuppressForStreak(streak: number): boolean {
  return [7, 14, 30, 60, 100, 365].includes(streak);
}

/** Record user feedback about a bad ad */
export async function reportBadAd(reason: string): Promise<void> {
  const state = await getState();
  state.adFeedback.push({ timestamp: Date.now(), reason });
  await saveState(state);
}
