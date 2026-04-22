import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
  Easing, interpolate, runOnJS,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Letter echo — ghost copy of a used letter that expands and fades
// ─────────────────────────────────────────────────────────────
export function LetterEcho({
  char, x, y, onDone,
}: { char: string; x: number; y: number; onDone: () => void }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(
      1,
      { duration: 560, easing: Easing.out(Easing.cubic) },
      (done) => {
        if (done) runOnJS(onDone)();
      },
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x },
      { translateY: y },
      { scale: interpolate(progress.value, [0, 1], [1, 2.6]) },
    ],
    opacity: interpolate(progress.value, [0, 0.12, 1], [0, 0.95, 0]),
  }));
  return (
    <Animated.View style={[styles.letterEcho, style]} pointerEvents="none">
      <Text style={styles.letterEchoText}>{char}</Text>
    </Animated.View>
  );
}
