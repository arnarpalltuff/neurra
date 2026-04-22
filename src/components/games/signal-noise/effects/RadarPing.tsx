import React, { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, interpolate,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Radar ping — circular wave from center of the scene
// ─────────────────────────────────────────────────────────────
export function RadarPing() {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withRepeat(
      withTiming(1, { duration: 3500, easing: Easing.out(Easing.cubic) }),
      -1, false,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(prog.value, [0, 0.05, 0.6, 1], [0, 0.3, 0.1, 0]),
    transform: [{ scale: interpolate(prog.value, [0, 1], [0.05, 2.2]) }],
  }));
  return (
    <Animated.View style={[styles.radarPing, style]} pointerEvents="none" />
  );
}
