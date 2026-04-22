import React, { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Countdown ring — shrinking ring during the response window
// ─────────────────────────────────────────────────────────────
export function CountdownRing({ x, y, duration }: { x: number; y: number; duration: number }) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withTiming(1, { duration, easing: Easing.linear });
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(prog.value, [0, 0.1, 0.85, 1], [0, 0.45, 0.45, 0]),
    transform: [{ scale: interpolate(prog.value, [0, 1], [1.8, 0.4]) }],
    borderColor: `rgba(92,170,201,${interpolate(prog.value, [0, 0.7, 1], [0.5, 0.5, 0.1])})`,
  }));
  return (
    <Animated.View
      style={[styles.countdownRing, { left: x - 36, top: y - 36 }, style]}
      pointerEvents="none"
    />
  );
}
