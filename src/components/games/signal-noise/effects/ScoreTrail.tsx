import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate, runOnJS,
} from 'react-native-reanimated';
import { styles } from '../styles';

const { width: W } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Score trail — ghost +N flying from tap to score display
// ─────────────────────────────────────────────────────────────
export function ScoreTrail({ startX, startY, points, onDone }: {
  startX: number; startY: number; points: number; onDone: () => void;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: 600, easing: Easing.inOut(Easing.cubic) },
      (done) => { if (done) runOnJS(onDone)(); });
  }, []);
  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const tx = startX + (W / 2 - 20 - startX) * t;
    const ty = startY + (20 - startY) * t - Math.sin(t * Math.PI) * 40;
    return {
      transform: [{ translateX: tx }, { translateY: ty },
        { scale: interpolate(t, [0, 0.2, 0.9, 1], [0.4, 1, 0.8, 0.3]) }],
      opacity: interpolate(t, [0, 0.12, 0.85, 1], [0, 1, 1, 0]),
    };
  });
  return (
    <Animated.Text style={[styles.scoreTrail, style]} pointerEvents="none">
      +{points}
    </Animated.Text>
  );
}
