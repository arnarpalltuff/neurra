import React, { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Corner bracket idle breathing
// ─────────────────────────────────────────────────────────────
export function CornerBreathing() {
  const breath = useSharedValue(0);
  useEffect(() => {
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    borderColor: `rgba(92,170,201,${0.3 + breath.value * 0.35})`,
  }));
  return (
    <>
      <Animated.View style={[styles.corner, styles.cornerTL, styles.cornerBreath, style]} />
      <Animated.View style={[styles.corner, styles.cornerTR, styles.cornerBreath, style]} />
      <Animated.View style={[styles.corner, styles.cornerBL, styles.cornerBreath, style]} />
      <Animated.View style={[styles.corner, styles.cornerBR, styles.cornerBreath, style]} />
    </>
  );
}
