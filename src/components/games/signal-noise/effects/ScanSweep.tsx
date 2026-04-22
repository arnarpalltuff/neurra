import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, interpolate,
} from 'react-native-reanimated';
import { styles } from '../styles';

const { width: W } = Dimensions.get('window');
const SCENE_SIZE = W - 40;

// ─────────────────────────────────────────────────────────────
// Scan sweep — horizontal line sweeping down the scene
// ─────────────────────────────────────────────────────────────
export function ScanSweep() {
  const sweep = useSharedValue(0);
  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1, true,
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    top: interpolate(sweep.value, [0, 1], [0, SCENE_SIZE]),
    opacity: interpolate(sweep.value, [0, 0.05, 0.5, 0.95, 1], [0, 0.5, 0.35, 0.5, 0]),
  }));
  return (
    <Animated.View style={[styles.scanSweep, style]} pointerEvents="none" />
  );
}
