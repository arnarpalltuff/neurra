import React, { useEffect } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  Easing, interpolate, runOnJS,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Tap comet — glowing dot that flies from a tapped letter to the word bar
// ─────────────────────────────────────────────────────────────
export function TapComet({ startX, startY, onDone }: { startX: number; startY: number; onDone: () => void }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(
      1,
      { duration: 420, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onDone)();
      },
    );
  }, []);
  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const tx = startX + (0 - startX) * t;
    const ty = startY + (-190 - startY) * t;
    return {
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale: interpolate(t, [0, 0.25, 1], [0.3, 1.1, 0.4]) },
      ],
      opacity: interpolate(t, [0, 0.15, 0.85, 1], [0, 1, 1, 0]),
    };
  });
  return <Animated.View style={[styles.tapComet, style]} pointerEvents="none" />;
}
