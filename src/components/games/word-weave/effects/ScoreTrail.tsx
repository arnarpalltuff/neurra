import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  Easing, interpolate, runOnJS,
} from 'react-native-reanimated';
import { styles } from '../styles';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Score trail — ghost +N that flies from word bar to score pill
// ─────────────────────────────────────────────────────────────
export function ScoreTrail({ points, onDone }: { points: number; onDone: () => void }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(
      1,
      { duration: 600, easing: Easing.inOut(Easing.cubic) },
      (done) => {
        if (done) runOnJS(onDone)();
      },
    );
  }, []);
  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const startX = width / 2 - 24;
    const startY = 250;
    const endX = width - 76;
    const endY = 26;
    const tx = startX + (endX - startX) * t;
    const ty = startY + (endY - startY) * t - Math.sin(t * Math.PI) * 36;
    return {
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale: interpolate(t, [0, 0.2, 0.85, 1], [0.4, 1, 0.9, 0.4]) },
      ],
      opacity: interpolate(t, [0, 0.12, 0.85, 1], [0, 1, 1, 0]),
    };
  });
  return (
    <Animated.Text style={[styles.scoreTrail, style]} pointerEvents="none">
      +{points}
    </Animated.Text>
  );
}
