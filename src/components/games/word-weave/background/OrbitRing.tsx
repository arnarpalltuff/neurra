import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Decorative rotating ring — speeds up with combo
// ─────────────────────────────────────────────────────────────
export function OrbitRing({
  color = 'rgba(155,114,224,0.12)',
  combo = 0,
}: { color?: string; combo?: number }) {
  const rot = useSharedValue(0);
  const speed = useSharedValue(1);
  useEffect(() => {
    rot.value = withRepeat(
      withTiming(1, { duration: 60000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);
  useEffect(() => {
    speed.value = withTiming(Math.min(3.5, 1 + combo * 0.22), { duration: 500 });
  }, [combo]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 360 * speed.value}deg` }],
  }));
  return (
    <Animated.View style={[styles.orbitRing, { borderColor: color }, style]} pointerEvents="none">
      <View style={[styles.orbitTick, { top: -3, left: '50%', marginLeft: -3, backgroundColor: color }]} />
      <View style={[styles.orbitTick, { bottom: -3, left: '25%', backgroundColor: color }]} />
      <View style={[styles.orbitTick, { bottom: -3, right: '25%', backgroundColor: color }]} />
    </Animated.View>
  );
}
