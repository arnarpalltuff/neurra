import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  withRepeat, withSequence, withDelay, Easing, FadeIn, FadeInDown,
} from 'react-native-reanimated';
import { tapHeavy, tapMedium, success as hapticSuccess } from '../../utils/haptics';
import { playChestOpen, playRareReveal, playCoinCascade } from '../../utils/sound';
import { colors } from '../../constants/colors';
import CountUpText from './CountUpText';

// ── Types ──────────────────────────────────────────────
export type ChestRarity = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface ChestReward {
  coins: number;
  bonusXP: number;
  specialItem?: string;
}

function rollChestReward(rarity: ChestRarity): ChestReward {
  switch (rarity) {
    case 'diamond': {
      const coins = 80 + Math.floor(Math.random() * 21);
      return { coins, bonusXP: 50, specialItem: 'Rare Kova Aura' };
    }
    case 'gold': {
      const coins = 40 + Math.floor(Math.random() * 21);
      const hasItem = Math.random() < 0.3;
      return { coins, bonusXP: 25, specialItem: hasItem ? 'Grove Decoration' : undefined };
    }
    case 'silver': {
      const coins = 20 + Math.floor(Math.random() * 21);
      return { coins, bonusXP: 10 };
    }
    default: {
      const coins = 10 + Math.floor(Math.random() * 11);
      return { coins, bonusXP: 0 };
    }
  }
}

export function getChestRarity(avgAccuracy: number, hadCombo10: boolean): ChestRarity {
  if (avgAccuracy >= 0.95 && hadCombo10) return 'diamond';
  if (avgAccuracy >= 0.85) return 'gold';
  if (avgAccuracy >= 0.70) return 'silver';
  return 'bronze';
}

const CHEST_COLORS: Record<ChestRarity, { primary: string; glow: string }> = {
  bronze: { primary: '#CD7F32', glow: '#CD7F3260' },
  silver: { primary: '#C0C0C0', glow: '#C0C0C060' },
  gold: { primary: colors.streak, glow: colors.streakDim },
  diamond: { primary: '#B9F2FF', glow: '#B9F2FF60' },
};

const CHEST_EMOJI: Record<ChestRarity, string> = {
  bronze: '🪙',
  silver: '📦',
  gold: '🎁',
  diamond: '💎',
};

// ── Component ──────────────────────────────────────────
interface RewardChestProps {
  rarity: ChestRarity;
  onClaimed: (reward: ChestReward) => void;
}

export default function RewardChest({ rarity, onClaimed }: RewardChestProps) {
  const [state, setState] = useState<'idle' | 'shaking' | 'opened'>('idle');
  const [reward] = useState(() => rollChestReward(rarity));

  const chestScale = useSharedValue(0);
  const chestRotation = useSharedValue(0);
  const chestGlow = useSharedValue(0.3);
  const lidY = useSharedValue(0);
  const beamOpacity = useSharedValue(0);
  const rewardOpacity = useSharedValue(0);

  useEffect(() => {
    // Entrance
    chestScale.value = withSpring(1, { damping: 10, stiffness: 150 });
    // Idle rocking
    chestRotation.value = withRepeat(
      withSequence(
        withTiming(3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(-3, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    // Glow pulse
    chestGlow.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 }),
      ),
      -1,
      true,
    );
  }, []);

  const handleTap = useCallback(() => {
    if (state !== 'idle') return;
    setState('shaking');
    tapMedium();

    // Shaking intensifies
    chestRotation.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
      ),
      6,
      true,
    );

    // After shaking, burst open
    setTimeout(() => {
      setState('opened');
      tapHeavy();

      playChestOpen();
      if (rarity === 'diamond' || rarity === 'gold') {
        hapticSuccess();
        playRareReveal();
      }
      playCoinCascade();

      // Lid flies up
      lidY.value = withTiming(-60, { duration: 300, easing: Easing.out(Easing.cubic) });
      // Light beam
      beamOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(800, withTiming(0, { duration: 500 })),
      );
      // Show rewards
      rewardOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));
      // Stop rocking
      chestRotation.value = withTiming(0, { duration: 100 });

      onClaimed(reward);
    }, 600);
  }, [state, rarity, reward, onClaimed]);

  const chestStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: chestScale.value },
      { rotate: `${chestRotation.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: chestGlow.value,
  }));

  const lidStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lidY.value }],
  }));

  const beamStyle = useAnimatedStyle(() => ({
    opacity: beamOpacity.value,
  }));

  const rewardStyle = useAnimatedStyle(() => ({
    opacity: rewardOpacity.value,
  }));

  const chestColor = CHEST_COLORS[rarity];
  const rarityLabel = rarity.charAt(0).toUpperCase() + rarity.slice(1);

  return (
    <View style={styles.container}>
      {state !== 'opened' && (
        <Text style={styles.tapHint}>Tap to open!</Text>
      )}

      <Pressable onPress={handleTap} disabled={state !== 'idle'}>
        <Animated.View style={[styles.chestWrapper, chestStyle]}>
          {/* Glow behind chest */}
          <Animated.View style={[styles.glow, glowStyle, { backgroundColor: chestColor.glow }]} />

          {/* Chest body */}
          <View style={[styles.chestBody, { borderColor: chestColor.primary }]}>
            <Text style={styles.chestIcon}>{CHEST_EMOJI[rarity]}</Text>
            <Animated.View style={[styles.chestLid, lidStyle, { borderColor: chestColor.primary }]}>
              <Text style={[styles.rarityLabel, { color: chestColor.primary }]}>
                {rarityLabel}
              </Text>
            </Animated.View>
          </View>

          {/* Light beam */}
          <Animated.View style={[styles.beam, beamStyle, { backgroundColor: chestColor.primary }]} />
        </Animated.View>
      </Pressable>

      {/* Reward reveal */}
      {state === 'opened' && (
        <Animated.View style={[styles.rewardArea, rewardStyle]}>
          <View style={styles.rewardRow}>
            <Text style={styles.rewardEmoji}>🪙</Text>
            <CountUpText
              value={reward.coins}
              prefix="+"
              duration={800}
              delay={500}
              style={[styles.rewardValue, { color: colors.streak }]}
            />
            <Text style={styles.rewardLabel}>coins</Text>
          </View>

          {reward.bonusXP > 0 && (
            <Animated.View entering={FadeInDown.delay(700)} style={styles.rewardRow}>
              <Text style={styles.rewardEmoji}>⚡</Text>
              <CountUpText
                value={reward.bonusXP}
                prefix="+"
                duration={600}
                delay={800}
                style={[styles.rewardValue, { color: colors.warm }]}
              />
              <Text style={styles.rewardLabel}>bonus XP</Text>
            </Animated.View>
          )}

          {reward.specialItem && (
            <Animated.View entering={FadeInDown.delay(1200)} style={styles.specialRow}>
              <Text style={styles.specialEmoji}>✨</Text>
              <Text style={[styles.specialText, { color: chestColor.primary }]}>
                {reward.specialItem}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  tapHint: {
    color: colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chestWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  chestBody: {
    width: 100,
    height: 80,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chestIcon: {
    fontSize: 36,
  },
  chestLid: {
    position: 'absolute',
    top: -12,
    width: 110,
    height: 30,
    backgroundColor: colors.bgTertiary,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rarityLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  beam: {
    position: 'absolute',
    width: 4,
    height: 200,
    top: -180,
    borderRadius: 2,
    opacity: 0.6,
  },
  rewardArea: {
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardEmoji: {
    fontSize: 20,
  },
  rewardValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  rewardLabel: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: '600',
  },
  specialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  specialEmoji: {
    fontSize: 16,
  },
  specialText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
