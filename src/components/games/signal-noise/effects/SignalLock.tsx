import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay,
  Easing, interpolate,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Signal lock — targeting brackets closing in on the change
// ─────────────────────────────────────────────────────────────
export function SignalLock({ x, y }: { x: number; y: number }) {
  const prog = useSharedValue(0);
  const breathe = useSharedValue(0);
  useEffect(() => {
    prog.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    breathe.value = withDelay(800, withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    ));
  }, []);

  const topLeft = useAnimatedStyle(() => {
    const offset = interpolate(prog.value, [0, 1], [60, 0]);
    const op = interpolate(prog.value, [0, 0.2, 1], [0, 0.7, 0.55 + breathe.value * 0.25]);
    return { transform: [{ translateX: -offset }, { translateY: -offset }], opacity: op };
  });
  const topRight = useAnimatedStyle(() => {
    const offset = interpolate(prog.value, [0, 1], [60, 0]);
    const op = interpolate(prog.value, [0, 0.2, 1], [0, 0.7, 0.55 + breathe.value * 0.25]);
    return { transform: [{ translateX: offset }, { translateY: -offset }], opacity: op };
  });
  const botLeft = useAnimatedStyle(() => {
    const offset = interpolate(prog.value, [0, 1], [60, 0]);
    const op = interpolate(prog.value, [0, 0.2, 1], [0, 0.7, 0.55 + breathe.value * 0.25]);
    return { transform: [{ translateX: -offset }, { translateY: offset }], opacity: op };
  });
  const botRight = useAnimatedStyle(() => {
    const offset = interpolate(prog.value, [0, 1], [60, 0]);
    const op = interpolate(prog.value, [0, 0.2, 1], [0, 0.7, 0.55 + breathe.value * 0.25]);
    return { transform: [{ translateX: offset }, { translateY: offset }], opacity: op };
  });

  return (
    <View style={[styles.signalLockWrap, { left: x - 28, top: y - 28 }]} pointerEvents="none">
      <Animated.View style={[styles.lockBracket, styles.lockTL, topLeft]} />
      <Animated.View style={[styles.lockBracket, styles.lockTR, topRight]} />
      <Animated.View style={[styles.lockBracket, styles.lockBL, botLeft]} />
      <Animated.View style={[styles.lockBracket, styles.lockBR, botRight]} />
    </View>
  );
}
