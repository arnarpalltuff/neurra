import React, { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  Easing, interpolate, runOnJS,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Bonus sparkle — golden expanding ring on bonus-letter harvest
// ─────────────────────────────────────────────────────────────
export function BonusSparkle({
  x, y, onDone,
}: { x: number; y: number; onDone: () => void }) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withTiming(
      1,
      { duration: 720, easing: Easing.out(Easing.cubic) },
      (done) => {
        if (done) runOnJS(onDone)();
      },
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x },
      { translateY: y },
      { scale: interpolate(prog.value, [0, 1], [0.4, 4.2]) },
    ],
    opacity: interpolate(prog.value, [0, 0.12, 1], [0, 1, 0]),
  }));
  return (
    <Animated.View style={[styles.bonusSparkle, style]} pointerEvents="none" />
  );
}
