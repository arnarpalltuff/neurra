import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Scan reticle — rotating targeting scope, speeds up with streak
// ─────────────────────────────────────────────────────────────
export function ScanReticle({ streak }: { streak: number }) {
  const rot = useSharedValue(0);
  const speed = useSharedValue(1);
  useEffect(() => {
    rot.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.linear }),
      -1, false,
    );
  }, []);
  useEffect(() => {
    speed.value = withTiming(Math.min(3.5, 1 + streak * 0.2), { duration: 400 });
  }, [streak]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 360 * speed.value}deg` }],
  }));
  return (
    <Animated.View style={[styles.scanReticle, style]} pointerEvents="none">
      <View style={styles.scanLine} />
      <View style={styles.scanLineCross} />
      <View style={styles.scanLineDiag} />
    </Animated.View>
  );
}
