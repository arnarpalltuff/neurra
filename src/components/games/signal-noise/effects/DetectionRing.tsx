import React, { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate, runOnJS,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Detection ring — expanding ring on correct tap
// ─────────────────────────────────────────────────────────────
export function DetectionRing({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) },
      (done) => { if (done) runOnJS(onDone)(); });
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(prog.value, [0, 0.1, 1], [0, 0.9, 0]),
    transform: [{ scale: interpolate(prog.value, [0, 1], [0.3, 2.8]) }],
  }));
  return (
    <Animated.View
      style={[styles.detectionRing, { left: x - 40, top: y - 40 }, style]}
      pointerEvents="none"
    />
  );
}
