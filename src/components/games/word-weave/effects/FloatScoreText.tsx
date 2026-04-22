import React, { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay,
  Easing, interpolate,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Floating "+N" score text that rises from the center
// ─────────────────────────────────────────────────────────────
export function FloatScoreText({ points, big }: { points: number; big: boolean }) {
  const rise = useSharedValue(0);
  const fade = useSharedValue(1);
  useEffect(() => {
    rise.value = withTiming(1, { duration: big ? 1400 : 1200, easing: Easing.out(Easing.cubic) });
    fade.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(400, withTiming(0, { duration: 600 })),
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { translateY: interpolate(rise.value, [0, 1], [0, big ? -130 : -90]) },
      { scale: interpolate(rise.value, [0, 0.2, 1], [0.6, big ? 1.5 : 1.15, big ? 1.2 : 1]) },
    ],
  }));
  return (
    <Animated.Text style={[styles.floatScore, big && styles.floatScoreBig, style]} pointerEvents="none">
      +{points}
    </Animated.Text>
  );
}
