import React, { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate, runOnJS,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Correct shape highlight — brief green ring on the identified shape
// ─────────────────────────────────────────────────────────────
export function ShapeHighlight({ x, y, r, onDone }: { x: number; y: number; r: number; onDone: () => void }) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) },
      (done) => { if (done) runOnJS(onDone)(); });
  }, []);
  const sz = r * 2 + 12;
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(prog.value, [0, 0.1, 0.7, 1], [0, 0.85, 0.6, 0]),
    transform: [{ scale: interpolate(prog.value, [0, 0.2, 1], [0.8, 1.1, 1.05]) }],
  }));
  return (
    <Animated.View
      style={[styles.shapeHighlight, {
        left: x - sz / 2,
        top: y - sz / 2,
        width: sz,
        height: sz,
        borderRadius: sz / 2,
      }, style]}
      pointerEvents="none"
    />
  );
}
