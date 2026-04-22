import React, { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Change glow — pulse at the changed shape position
// ─────────────────────────────────────────────────────────────
export function ChangeGlow({ x, y }: { x: number; y: number }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
        withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: pulse.value * 0.6,
    transform: [{ scale: 0.8 + pulse.value * 0.4 }],
  }));
  return (
    <Animated.View
      style={[styles.changeGlow, { left: x - 35, top: y - 35 }, style]}
      pointerEvents="none"
    />
  );
}
