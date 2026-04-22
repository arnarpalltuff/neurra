import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KovaCosmetic } from './kovaStore';

// ── Reward Types ─────────────────────────────────────────────

export type RewardRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type RewardType =
  | 'xp_boost'
  | 'xp_flat'
  | 'streak_shield'
  | 'cosmetic'
  | 'bonus_challenge';

export interface Reward {
  id: string;
  type: RewardType;
  rarity: RewardRarity;
  name: string;
  description: string;
  value?: number;
  kovaCosmetic?: KovaCosmetic;
}

// ── Rarity Colors ────────────────────────────────────────────

export const RARITY_COLORS: Record<RewardRarity, string> = {
  common: '#6ECF9A',
  uncommon: '#6BA8E0',
  rare: '#9B72E0',
  legendary: '#F0B542',
};

// ── Loot Table ───────────────────────────────────────────────

interface RarityTier {
  weight: number;
  rewards: Omit<Reward, 'id' | 'rarity'>[];
}

const LOOT_TABLE: Record<RewardRarity, RarityTier> = {
  common: {
    weight: 55,
    rewards: [
      { type: 'xp_flat', name: '+10 XP', description: 'A small boost', value: 10 },
      { type: 'xp_flat', name: '+15 XP', description: 'Not bad!', value: 15 },
      { type: 'xp_flat', name: '+20 XP', description: 'Solid gains', value: 20 },
    ],
  },
  uncommon: {
    weight: 28,
    rewards: [
      { type: 'xp_boost', name: '1.5x XP Boost', description: 'Next challenge gives 1.5x XP', value: 1.5 },
      { type: 'xp_flat', name: '+50 XP', description: 'A big chunk of XP!', value: 50 },
      { type: 'bonus_challenge', name: 'Bonus Round', description: 'One extra challenge unlocked today' },
    ],
  },
  rare: {
    weight: 13,
    rewards: [
      { type: 'xp_boost', name: '2x XP Boost', description: 'Next challenge gives 2x XP', value: 2.0 },
      { type: 'streak_shield', name: 'Streak Shield', description: 'Protects your streak for one missed day' },
      {
        type: 'cosmetic', name: 'Kova Aura: Ocean', description: 'A deep blue glow',
        kovaCosmetic: { id: 'aura_ocean', name: 'Ocean Aura', type: 'aura', color: '#6BA8E0', description: 'A deep blue glow surrounds Kova' },
      },
      {
        type: 'cosmetic', name: 'Kova Aura: Sunset', description: 'Warm peach light',
        kovaCosmetic: { id: 'aura_sunset', name: 'Sunset Aura', type: 'aura', color: '#E09B6B', description: 'Warm peach light radiates from Kova' },
      },
      {
        type: 'cosmetic', name: 'Gold Particles', description: 'Golden sparkles',
        kovaCosmetic: { id: 'particles_gold', name: 'Gold Particles', type: 'particle_color', color: '#F0B542', description: 'Kova emits golden sparkles' },
      },
    ],
  },
  legendary: {
    weight: 4,
    rewards: [
      { type: 'xp_boost', name: '3x XP Boost', description: 'Next challenge gives 3x XP!', value: 3.0 },
      {
        type: 'cosmetic', name: 'Stardust Trail', description: 'A trail of stars',
        kovaCosmetic: { id: 'trail_stardust', name: 'Stardust Trail', type: 'trail', color: '#FFFFFF', description: 'A trail of stars follows Kova' },
      },
      {
        type: 'cosmetic', name: 'Aurora Aura', description: 'Northern lights',
        kovaCosmetic: { id: 'aura_aurora', name: 'Aurora Aura', type: 'aura', color: '#9B72E0', description: 'Shimmering northern lights surround Kova' },
      },
      {
        type: 'cosmetic', name: 'Cosmic Particles', description: 'Purple cosmic energy',
        kovaCosmetic: { id: 'particles_cosmic', name: 'Cosmic Particles', type: 'particle_color', color: '#9B72E0', description: 'Purple cosmic energy orbits Kova' },
      },
    ],
  },
};

// ── Drop Algorithm ───────────────────────────────────────────

function rollRarity(): RewardRarity {
  const roll = Math.floor(Math.random() * 100);
  if (roll < LOOT_TABLE.common.weight) return 'common';
  if (roll < LOOT_TABLE.common.weight + LOOT_TABLE.uncommon.weight) return 'uncommon';
  if (roll < LOOT_TABLE.common.weight + LOOT_TABLE.uncommon.weight + LOOT_TABLE.rare.weight) return 'rare';
  return 'legendary';
}

function pickReward(rarity: RewardRarity, ownedCosmetics: string[]): Reward {
  const tier = LOOT_TABLE[rarity];
  let picks = tier.rewards;

  // Try to avoid duplicate cosmetics
  let chosen = picks[Math.floor(Math.random() * picks.length)];
  if (chosen.type === 'cosmetic' && chosen.kovaCosmetic && ownedCosmetics.includes(chosen.kovaCosmetic.id)) {
    // Re-roll once within the same tier
    const nonDupes = picks.filter(
      r => r.type !== 'cosmetic' || !r.kovaCosmetic || !ownedCosmetics.includes(r.kovaCosmetic.id),
    );
    if (nonDupes.length > 0) {
      chosen = nonDupes[Math.floor(Math.random() * nonDupes.length)];
    } else {
      // All cosmetics owned — give flat XP instead
      const xpFallback = rarity === 'legendary' ? 100 : rarity === 'rare' ? 50 : 25;
      chosen = { type: 'xp_flat', name: `+${xpFallback} XP`, description: 'All cosmetics collected!', value: xpFallback };
    }
  }

  return {
    ...chosen,
    id: `reward_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    rarity,
  };
}

/** Roll a reward from the loot table. */
export function rollReward(ownedCosmetics: string[]): Reward {
  const rarity = rollRarity();
  return pickReward(rarity, ownedCosmetics);
}

// ── Store ────────────────────────────────────────────────────

interface RewardStoreState {
  activeXpBoost: { multiplier: number } | null;
  bonusChallengesAvailable: number;
  rewardHistory: Array<{ reward: Reward; earnedAt: string }>;
  totalChestsOpened: number;

  /** Apply a reward after chest reveal. */
  applyReward: (reward: Reward) => void;

  /** Consume the XP boost (returns the multiplier, or 1 if none active). */
  consumeXpBoost: () => number;

  /** Consume a bonus challenge. Returns true if one was available. */
  consumeBonusChallenge: () => boolean;
}

export const useRewardStore = create<RewardStoreState>()(
  persist(
    (set, get) => ({
      activeXpBoost: null,
      bonusChallengesAvailable: 0,
      rewardHistory: [],
      totalChestsOpened: 0,

      applyReward: (reward) => {
        const state = get();
        const updates: Partial<RewardStoreState> = {
          totalChestsOpened: state.totalChestsOpened + 1,
          rewardHistory: [
            ...state.rewardHistory.slice(-49),
            { reward, earnedAt: new Date().toISOString() },
          ],
        };

        switch (reward.type) {
          case 'xp_flat':
            // XP is applied externally via progressStore.addXP
            break;
          case 'xp_boost':
            updates.activeXpBoost = {
              multiplier: reward.value ?? 1.5,
            };
            break;
          case 'streak_shield':
            // Routed directly to progressStore.addStreakFreeze by the
            // chest; no rewardStore-side state to update.
            break;
          case 'bonus_challenge':
            updates.bonusChallengesAvailable = state.bonusChallengesAvailable + 1;
            break;
          case 'cosmetic':
            // Cosmetic is applied externally via kovaStore.addCosmetic
            break;
        }

        set(updates);
      },

      consumeXpBoost: () => {
        const { activeXpBoost } = get();
        if (!activeXpBoost) return 1;
        set({ activeXpBoost: null });
        return activeXpBoost.multiplier;
      },

      consumeBonusChallenge: () => {
        const { bonusChallengesAvailable } = get();
        if (bonusChallengesAvailable <= 0) return false;
        set({ bonusChallengesAvailable: bonusChallengesAvailable - 1 });
        return true;
      },
    }),
    {
      name: 'neurra-rewards',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
