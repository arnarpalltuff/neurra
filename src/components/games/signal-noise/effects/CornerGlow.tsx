import React, { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Corner bracket glow — flashes on correct
// ─────────────────────────────────────────────────────────────
export function CornerGlow({ trigger }: { trigger: number }) {
  const glow = useSharedValue(0);
  useEffect(() => {
    if (trigger === 0) return;
    glow.value = withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
  }, [trigger]);
  const style = useAnimatedStyle(() => ({
    borderColor: `rgba(92,170,201,${0.6 + glow.value * 0.4})`,
    shadowOpacity: glow.value,
  }));
  return (
    <>
      <Animated.View style={[styles.corner, styles.cornerTL, style]} />
      <Animated.View style={[styles.corner, styles.cornerTR, style]} />
      <Animated.View style={[styles.corner, styles.cornerBL, style]} />
      <Animated.View style={[styles.corner, styles.cornerBR, style]} />
    </>
  );
}
