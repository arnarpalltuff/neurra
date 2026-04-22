import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate, runOnJS,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Tap crosshair — brief crosshair flash where the player tapped
// ─────────────────────────────────────────────────────────────
export function TapCrosshair({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) },
      (done) => { if (done) runOnJS(onDone)(); });
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(prog.value, [0, 0.1, 0.7, 1], [0, 1, 0.6, 0]),
    transform: [{ scale: interpolate(prog.value, [0, 0.15, 1], [0.5, 1.1, 0.9]) }],
  }));
  return (
    <Animated.View style={[styles.tapCrosshair, { left: x - 18, top: y - 18 }, style]} pointerEvents="none">
      <View style={styles.crossH} />
      <View style={styles.crossV} />
    </Animated.View>
  );
}
