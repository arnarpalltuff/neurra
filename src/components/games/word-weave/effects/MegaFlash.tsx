import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, withDelay,
  Easing, interpolate,
} from 'react-native-reanimated';
import { C } from '../../../../constants/colors';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Mega burst for 6+ letter words
// ─────────────────────────────────────────────────────────────
export function MegaBurst({ onDone }: { onDone: () => void }) {
  const ring = useSharedValue(0);
  useEffect(() => {
    ring.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(ring.value, [0, 0.1, 1], [0, 0.95, 0]),
    transform: [{ scale: interpolate(ring.value, [0, 1], [0.2, 2.4]) }],
  }));
  return (
    <Animated.View style={[styles.megaRing, style]} pointerEvents="none" />
  );
}

// ─────────────────────────────────────────────────────────────
// Mega flash — chromatic-aberration word reveal for 6+ words
// ─────────────────────────────────────────────────────────────
export function MegaFlash({ word, triggerId, onDone }: { word: string; triggerId: number; onDone: () => void }) {
  const shift = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);
  useEffect(() => {
    shift.value = withSequence(
      withTiming(1, { duration: 70, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 340, easing: Easing.in(Easing.cubic) }),
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 70 }),
      withDelay(220, withTiming(0, { duration: 280 })),
    );
    scale.value = withSequence(
      withSpring(1.08, { damping: 6, stiffness: 220 }),
      withSpring(1, { damping: 9 }),
    );
    const t = setTimeout(onDone, 620);
    return () => clearTimeout(t);
  }, [triggerId]);

  const baseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const redStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.85,
    transform: [{ scale: scale.value }, { translateX: -shift.value * 14 }],
  }));
  const cyanStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.85,
    transform: [{ scale: scale.value }, { translateX: shift.value * 14 }],
  }));

  const upper = word.toUpperCase();
  return (
    <View style={styles.megaFlashWrap} pointerEvents="none">
      <Animated.Text style={[styles.megaFlashText, { color: C.coral }, redStyle]}>{upper}</Animated.Text>
      <Animated.Text style={[styles.megaFlashText, { color: C.blue }, cyanStyle]}>{upper}</Animated.Text>
      <Animated.Text style={[styles.megaFlashText, styles.megaFlashCore, baseStyle]}>{upper}</Animated.Text>
    </View>
  );
}
