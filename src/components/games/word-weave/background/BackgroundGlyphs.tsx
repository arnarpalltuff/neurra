import React, { useEffect } from 'react';
import { Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay,
  Easing, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { styles } from '../styles';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Ambient drifting background glyphs
// ─────────────────────────────────────────────────────────────
export function BackgroundGlyphs() {
  const g1 = useSharedValue(0);
  const g2 = useSharedValue(0);
  const g3 = useSharedValue(0);

  useEffect(() => {
    g1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    g2.value = withDelay(3000, withRepeat(
      withSequence(
        withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 14000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    ));
    g3.value = withDelay(6000, withRepeat(
      withSequence(
        withTiming(1, { duration: 16000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 16000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    ));
  }, []);

  const style1 = useAnimatedStyle(() => ({
    opacity: interpolate(g1.value, [0, 1], [0.018, 0.05], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g1.value, [0, 1], [0, -14]) }],
  }));
  const style2 = useAnimatedStyle(() => ({
    opacity: interpolate(g2.value, [0, 1], [0.015, 0.04], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g2.value, [0, 1], [0, -10]) }],
  }));
  const style3 = useAnimatedStyle(() => ({
    opacity: interpolate(g3.value, [0, 1], [0.02, 0.045], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g3.value, [0, 1], [0, -12]) }],
  }));

  return (
    <>
      <Animated.Text style={[styles.bgGlyph, { top: height * 0.12, left: -20 }, style1]}>A</Animated.Text>
      <Animated.Text style={[styles.bgGlyph, { top: height * 0.42, right: -30 }, style2]}>W</Animated.Text>
      <Animated.Text style={[styles.bgGlyph, { bottom: height * 0.08, left: width * 0.1 }, style3]}>O</Animated.Text>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Parallax back layer — distant drifting glyphs for depth
// ─────────────────────────────────────────────────────────────
export function BackgroundGlyphsFar() {
  const g1 = useSharedValue(0);
  const g2 = useSharedValue(0);
  const g3 = useSharedValue(0);
  const g4 = useSharedValue(0);

  useEffect(() => {
    const loop = (dur: number) =>
      withRepeat(
        withSequence(
          withTiming(1, { duration: dur, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: dur, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    g1.value = loop(18000);
    g2.value = withDelay(2500, loop(20000));
    g3.value = withDelay(5200, loop(22000));
    g4.value = withDelay(8000, loop(24000));
  }, []);

  const s1 = useAnimatedStyle(() => ({
    opacity: interpolate(g1.value, [0, 1], [0.007, 0.022], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g1.value, [0, 1], [0, 18]) }],
  }));
  const s2 = useAnimatedStyle(() => ({
    opacity: interpolate(g2.value, [0, 1], [0.007, 0.022], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g2.value, [0, 1], [0, 18]) }],
  }));
  const s3 = useAnimatedStyle(() => ({
    opacity: interpolate(g3.value, [0, 1], [0.007, 0.022], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g3.value, [0, 1], [0, 18]) }],
  }));
  const s4 = useAnimatedStyle(() => ({
    opacity: interpolate(g4.value, [0, 1], [0.007, 0.022], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(g4.value, [0, 1], [0, 18]) }],
  }));

  return (
    <>
      <Animated.Text style={[styles.bgGlyphFar, { top: height * 0.22, left: width * 0.18 }, s1]}>R</Animated.Text>
      <Animated.Text style={[styles.bgGlyphFar, { top: height * 0.48, right: width * 0.12 }, s2]}>E</Animated.Text>
      <Animated.Text style={[styles.bgGlyphFar, { bottom: height * 0.22, left: width * 0.48 }, s3]}>N</Animated.Text>
      <Animated.Text style={[styles.bgGlyphFar, { top: height * 0.30, left: width * 0.66 }, s4]}>V</Animated.Text>
    </>
  );
}
