import React, { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, interpolate,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Missed pulse — persistent pulsing ring at the missed location
// ─────────────────────────────────────────────────────────────
export function MissedPulse({ x, y }: { x: number; y: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
      -1, false,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.2, 1], [0, 0.85, 0]),
    transform: [{ scale: interpolate(p.value, [0, 1], [0.5, 2.4]) }],
  }));
  return (
    <Animated.View
      style={[styles.missedPulse, { left: x - 30, top: y - 30 }, style]}
      pointerEvents="none"
    />
  );
}
