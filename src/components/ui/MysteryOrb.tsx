import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  withRepeat, withSequence, withDelay, Easing,
} from 'react-native-reanimated';
import { tapHeavy, success as hapticSuccess } from '../../utils/haptics';
import { playMysteryOrb, playRareReveal, playCoinEarned } from '../../utils/sound';
import { C } from '../../constants/colors';

// ── Rarity system ──────────────────────────────────────
type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

interface OrbReward {
  rarity: Rarity;
  xp: number;
  coins: number;
  message: string;
}

function rollReward(): OrbReward {
  const roll = Math.random();
  if (roll < 0.02) {
    return { rarity: 'legendary', xp: 100, coins: 10, message: '🌟 LEGENDARY! 100 XP + 10 Coins!' };
  }
  if (roll < 0.10) {
    return { rarity: 'rare', xp: 50, coins: 0, message: '💜 Rare! 50 bonus XP!' };
  }
  if (roll < 0.30) {
    return { rarity: 'uncommon', xp: 0, coins: 5, message: '💎 5 Kova Coins!' };
  }
  return { rarity: 'common', xp: 25, coins: 0, message: '✨ 25 bonus XP!' };
}

const RARITY_COLORS: Record<Rarity, string> = {
  common: C.amber,
  uncommon: C.blue,
  rare: C.purple,
  legendary: '#FFD700',
};

const RARITY_GLOW: Record<Rarity, string> = {
  common: C.amber,
  uncommon: C.blue,
  rare: C.purple,
  legendary: '#FF6B35',
};

// ── Component ──────────────────────────────────────────
interface MysteryOrbProps {
  position: { x: number; y: number };
  onDismiss: () => void;
  onReward: (reward: OrbReward) => void;
}

export default function MysteryOrb({ position, onDismiss, onReward }: MysteryOrbProps) {
  const [reward] = useState(() => rollReward());
  const [opened, setOpened] = useState(false);

  const orbScale = useSharedValue(0);
  const orbRotation = useSharedValue(0);
  const orbGlow = useSharedValue(0.4);
  const revealScale = useSharedValue(0);
  const revealOpacity = useSharedValue(0);

  useEffect(() => {
    // Entrance: scale in with spring
    orbScale.value = withSpring(1, { damping: 8, stiffness: 200 });
    // Pulsing glow
    orbGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    // Gentle spin
    orbRotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
    );

    // Auto-open after 1.5s if not tapped
    const timer = setTimeout(() => {
      if (!opened) openOrb();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const openOrb = useCallback(() => {
    if (opened) return;
    setOpened(true);
    tapHeavy();

    // Burst open
    orbScale.value = withSequence(
      withTiming(1.5, { duration: 150 }),
      withTiming(0, { duration: 200 }),
    );

    // Show reward
    revealScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 180 }));
    revealOpacity.value = withDelay(200, withTiming(1, { duration: 200 }));

    playMysteryOrb();
    if (reward.rarity === 'legendary') {
      hapticSuccess();
      playRareReveal();
    } else if (reward.coins > 0) {
      playCoinEarned();
    }

    onReward(reward);

    // Auto-dismiss after showing reward
    setTimeout(onDismiss, 2000);
  }, [opened, reward, onReward, onDismiss]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: orbScale.value },
      { rotate: `${orbRotation.value}deg` },
    ],
    opacity: orbGlow.value,
  }));

  const revealStyle = useAnimatedStyle(() => ({
    transform: [{ scale: revealScale.value }],
    opacity: revealOpacity.value,
  }));

  const glowColor = RARITY_COLORS[reward.rarity];

  return (
    <View style={[styles.container, { left: position.x - 30, top: position.y - 30 }]} pointerEvents="box-none">
      {!opened && (
        <Pressable onPress={openOrb}>
          <Animated.View style={[styles.orb, orbStyle, {
            backgroundColor: glowColor,
            shadowColor: RARITY_GLOW[reward.rarity],
          }]}>
            <Text style={styles.orbIcon}>✦</Text>
          </Animated.View>
        </Pressable>
      )}

      {opened && (
        <Animated.View style={[styles.rewardCard, revealStyle, { borderColor: glowColor }]}>
          <Text style={[styles.rewardText, { color: glowColor }]}>
            {reward.message}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
  },
  orb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 10,
  },
  orbIcon: {
    fontSize: 24,
    color: '#FFF',
  },
  rewardCard: {
    backgroundColor: C.bg4,
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    minWidth: 160,
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
});
