import React, { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { C } from '../../../../constants/colors';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Streak fire — glowing halo on the streak pill at high streaks
// ─────────────────────────────────────────────────────────────
export function StreakFire({ streak }: { streak: number }) {
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.4, { duration: 600, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: glow.value * (streak >= 8 ? 0.9 : streak >= 5 ? 0.7 : 0.5),
  }));
  const color = streak >= 8 ? C.amber : streak >= 5 ? C.peach : '#5CAAC9';
  return (
    <Animated.View style={[styles.streakFire, { backgroundColor: color, shadowColor: color }, style]} pointerEvents="none" />
  );
}
