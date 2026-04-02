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
}

function defaultState(): AdState {
  return {
    date: todayStr(),
    bannerImpressions: 0,
    rewardedAdsShown: 0,
    coinRewardsCollected: 0,
    bonusRoundUnlocked: false,
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

/** Can we show a banner ad on the session summary? */
export async function canShowBanner(): Promise<boolean> {
  const state = await getState();
  return state.bannerImpressions < 3;
}

/** Record a banner impression */
export async function recordBannerImpression(): Promise<void> {
  const state = await getState();
  state.bannerImpressions += 1;
  await saveState(state);
}

/** Can the user watch a rewarded ad for the bonus round? */
export async function canShowBonusRoundAd(): Promise<boolean> {
  const state = await getState();
  return !state.bonusRoundUnlocked && state.rewardedAdsShown < 4;
}

/** Record bonus round ad watched */
export async function recordBonusRoundAd(): Promise<void> {
  const state = await getState();
  state.bonusRoundUnlocked = true;
  state.rewardedAdsShown += 1;
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
  return state.coinRewardsCollected < 3 && state.rewardedAdsShown < 4;
}

/** Record coin reward ad watched */
export async function recordCoinRewardAd(): Promise<void> {
  const state = await getState();
  state.coinRewardsCollected += 1;
  state.rewardedAdsShown += 1;
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
