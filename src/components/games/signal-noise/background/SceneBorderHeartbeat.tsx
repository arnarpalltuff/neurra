import React, { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Scene border heartbeat — subtle ambient pulse
// ─────────────────────────────────────────────────────────────
export function SceneBorderHeartbeat() {
  const beat = useSharedValue(0);
  useEffect(() => {
    beat.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }),
        withDelay(200, withTiming(0.6, { duration: 100, easing: Easing.out(Easing.cubic) })),
        withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }),
        withDelay(1200, withTiming(0, { duration: 0 })),
      ), -1, false,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    borderColor: `rgba(92,170,201,${beat.value * 0.2})`,
    shadowOpacity: beat.value * 0.3,
  }));
  return (
    <Animated.View style={[styles.sceneHeartbeat, style]} pointerEvents="none" />
  );
}
