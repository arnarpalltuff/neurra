import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayStr } from '../utils/timeUtils';

/**
 * F12 Energy system.
 *
 * The user has a small pool of "hearts" per day. Each full session costs 1
 * heart; Quick Hits cost 0 hearts but are capped separately. Hearts refill
 * lazily at the start of a new local calendar day.
 *
 * Sessions are NOT blocked when hearts hit zero — the user can keep playing
 * but earns half XP. This is a gentle nudge, not a wall.
 *
 * Free users get 5 hearts/day, Pro gets 8. Quick Hits cap at 5/day for both.
 */

export const FREE_MAX_HEARTS = 5;
export const PRO_MAX_HEARTS = 8;
export const MAX_QUICK_HITS_PER_DAY = 5;
export const DEPLETED_XP_MULTIPLIER = 0.5;

export function maxHeartsFor(isPro: boolean): number {
  return isPro ? PRO_MAX_HEARTS : FREE_MAX_HEARTS;
}

interface EnergyState {
  /** Current heart pool. May be larger than today's max if user just downgraded from Pro — that's fine, it drains naturally. */
  hearts: number;
  /** Date the heart pool was last refilled (YYYY-MM-DD). null = never. */
  lastRefillDate: string | null;
  /** Quick Hits used since `quickHitsDate`. Resets daily. */
  quickHitsUsed: number;
  quickHitsDate: string | null;

  /**
   * Lazy refill of BOTH hearts and Quick Hits. Idempotent within a day.
   * Pass the user's current Pro status so the heart cap is correct.
   *
   * The Quick Hit cap is independent of Pro status, so prefer
   * `refillQuickHitsIfNewDay()` from any code path that doesn't otherwise
   * know whether the user is Pro — that way an early-morning Quick Hit
   * can never accidentally refill hearts to the wrong cap.
   */
  refillIfNewDay: (isPro: boolean) => void;

  /** Refill only the Quick Hit counter (does not touch hearts). */
  refillQuickHitsIfNewDay: () => void;

  /**
   * Consume one heart for a full session. Returns the state at the moment
   * of consumption so callers can decide whether to award full or half XP.
   *
   * Always succeeds — sessions are never blocked. If hearts were already 0,
   * `wasDepleted` is true and the caller should halve XP.
   */
  consumeHeartForSession: (isPro: boolean) => { wasDepleted: boolean };

  /**
   * Try to start a Quick Hit. Returns false if the user has hit their daily
   * cap (caller should show "no more Quick Hits today").
   */
  tryConsumeQuickHit: () => boolean;

  /** Quick Hits left today (after lazy refill). */
  quickHitsRemaining: () => number;

  /** Dev/test reset. */
  reset: () => void;
}

export const useEnergyStore = create<EnergyState>()(
  persist(
    (set, get) => ({
      hearts: FREE_MAX_HEARTS,
      lastRefillDate: null,
      quickHitsUsed: 0,
      quickHitsDate: null,

      refillIfNewDay: (isPro) => {
        const today = todayStr();
        const s = get();
        const patch: Partial<EnergyState> = {};
        if (s.lastRefillDate !== today) {
          patch.hearts = maxHeartsFor(isPro);
          patch.lastRefillDate = today;
        }
        if (s.quickHitsDate !== today) {
          patch.quickHitsUsed = 0;
          patch.quickHitsDate = today;
        }
        if (Object.keys(patch).length > 0) set(patch);
      },

      refillQuickHitsIfNewDay: () => {
        const today = todayStr();
        const s = get();
        if (s.quickHitsDate === today) return;
        set({ quickHitsUsed: 0, quickHitsDate: today });
      },

      consumeHeartForSession: (isPro) => {
        get().refillIfNewDay(isPro);
        const s = get();
        if (s.hearts <= 0) {
          return { wasDepleted: true };
        }
        set({ hearts: s.hearts - 1 });
        return { wasDepleted: false };
      },

      tryConsumeQuickHit: () => {
        // Refill ONLY the Quick Hit counter so we don't accidentally re-cap
        // hearts to the free max (which would silently drop a Pro user from
        // 8 hearts to 5 if they tap Quick Hit before opening the home tab on
        // a fresh day).
        get().refillQuickHitsIfNewDay();
        const s = get();
        if (s.quickHitsUsed >= MAX_QUICK_HITS_PER_DAY) return false;
        set({ quickHitsUsed: s.quickHitsUsed + 1 });
        return true;
      },

      quickHitsRemaining: () => {
        const s = get();
        const today = todayStr();
        if (s.quickHitsDate !== today) return MAX_QUICK_HITS_PER_DAY;
        return Math.max(0, MAX_QUICK_HITS_PER_DAY - s.quickHitsUsed);
      },

      reset: () =>
        set({
          hearts: FREE_MAX_HEARTS,
          lastRefillDate: null,
          quickHitsUsed: 0,
          quickHitsDate: null,
        }),
    }),
    {
      name: 'neurra-energy',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
