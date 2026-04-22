import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay,
  Easing, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { styles } from '../styles';

const { width: W, height: H } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Parallax sensor text — drifting "SCANNING" background glyphs
// ─────────────────────────────────────────────────────────────
export function SensorGlyphs() {
  const g1 = useSharedValue(0);
  const g2 = useSharedValue(0);
  const g3 = useSharedValue(0);
  useEffect(() => {
    const loop = (dur: number) => withRepeat(
      withSequence(
        withTiming(1, { duration: dur, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: dur, easing: Easing.inOut(Easing.sin) }),
      ), -1, true,
    );
    g1.value = loop(16000);
    g2.value = withDelay(3000, loop(18000));
    g3.value = withDelay(6000, loop(20000));
  }, []);
  const s1 = useAnimatedStyle(() => ({
    opacity: interpolate(g1.value, [0, 1], [0.012, 0.035], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g1.value, [0, 1], [0, -16]) }],
  }));
  const s2 = useAnimatedStyle(() => ({
    opacity: interpolate(g2.value, [0, 1], [0.01, 0.03], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g2.value, [0, 1], [0, 14]) }],
  }));
  const s3 = useAnimatedStyle(() => ({
    opacity: interpolate(g3.value, [0, 1], [0.015, 0.04], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g3.value, [0, 1], [0, -12]) }],
  }));
  return (
    <>
      <Animated.Text style={[styles.sensorGlyph, { top: H * 0.15, left: -10 }, s1]}>SCAN</Animated.Text>
      <Animated.Text style={[styles.sensorGlyph, { top: H * 0.50, right: -20 }, s2]}>DETECT</Animated.Text>
      <Animated.Text style={[styles.sensorGlyph, { bottom: H * 0.12, left: W * 0.15 }, s3]}>FOCUS</Animated.Text>
    </>
  );
}
