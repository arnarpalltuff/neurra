import React, { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay,
  Easing, interpolate,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Float score text rising from a position
// ─────────────────────────────────────────────────────────────
export function FloatScore({ x, y, points }: { x: number; y: number; points: number }) {
  const rise = useSharedValue(0);
  const fade = useSharedValue(1);
  useEffect(() => {
    rise.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
    fade.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(350, withTiming(0, { duration: 500 })),
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { translateY: interpolate(rise.value, [0, 1], [0, -70]) },
      { scale: interpolate(rise.value, [0, 0.2, 1], [0.5, 1.3, 1]) },
    ],
  }));
  return (
    <Animated.Text
      style={[styles.floatScore, { left: x - 30, top: y - 24 }, style]}
      pointerEvents="none"
    >
      +{points}
    </Animated.Text>
  );
}
