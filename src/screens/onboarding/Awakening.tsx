import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { tapLight, tapMedium } from '../../utils/haptics';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import PulseRing from '../../components/onboarding/PulseRing';

interface AwakeningProps {
  onNext: () => void;
}

// Cinematic window — long enough to land, short enough to respect the user.
const AUTO_ADVANCE_MS = 4200;

const DARK = '#050810';

export default function Awakening({ onNext }: AwakeningProps) {
  const advancedRef = useRef(false);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dotScale = useSharedValue(0);
  const dotOpacity = useSharedValue(0);
  const haloOpacity = useSharedValue(0);
  const haloScale = useSharedValue(0.4);
  const textOpacity = useSharedValue(0);
  const textSpacing = useSharedValue(10);
  const tapOpacity = useSharedValue(0);
  const particleY = useSharedValue(0);
  const particleOpacity = useSharedValue(0);

  useEffect(() => {
    // 500ms — single tiny dot fades in.
    dotScale.value = withDelay(500, withSpring(1, { damping: 14, stiffness: 120 }));
    dotOpacity.value = withDelay(500, withTiming(0.6, { duration: 400, easing: Easing.out(Easing.ease) }));

    // 1000ms — first pulse ping. Haptic matches the visible ping.
    const pulse1 = setTimeout(() => {
      tapLight();
    }, 1000);

    // 1600ms — dot brightens.
    dotOpacity.value = withDelay(1600, withTiming(1, { duration: 500 }));

    // 2000ms — halo (radial bloom) grows.
    haloOpacity.value = withDelay(2000, withTiming(0.55, { duration: 900, easing: Easing.out(Easing.cubic) }));
    haloScale.value = withDelay(2000, withSpring(1, { damping: 16, stiffness: 70 }));

    // 2200ms — "NEURRA" text reveals, letter-spacing tightens.
    textOpacity.value = withDelay(2200, withTiming(0.9, { duration: 700, easing: Easing.out(Easing.cubic) }));
    textSpacing.value = withDelay(2200, withTiming(0.5, { duration: 800, easing: Easing.out(Easing.cubic) }));

    // 2800ms — subtle "tap to continue" prompt (not required — auto-advance fires).
    tapOpacity.value = withDelay(2800, withTiming(0.5, { duration: 600 }));

    // 2500ms — a single particle drifts up.
    particleOpacity.value = withDelay(
      2500,
      withSequence(
        withTiming(0.5, { duration: 600 }),
        withTiming(0, { duration: 2200 }),
      ),
    );
    particleY.value = withDelay(
      2500,
      withTiming(-140, { duration: 2800, easing: Easing.out(Easing.cubic) }),
    );

    navTimerRef.current = setTimeout(() => {
      if (!advancedRef.current) {
        advancedRef.current = true;
        onNext();
      }
    }, AUTO_ADVANCE_MS);

    return () => {
      clearTimeout(pulse1);
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
    // onNext identity shouldn't re-trigger the cinematic
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTap = () => {
    if (advancedRef.current) return;
    advancedRef.current = true;
    tapMedium();
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    onNext();
  };

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scale: dotScale.value }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value,
    transform: [{ scale: haloScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    letterSpacing: textSpacing.value,
  }));
  const tapStyle = useAnimatedStyle(() => ({ opacity: tapOpacity.value }));
  const particleStyle = useAnimatedStyle(() => ({
    opacity: particleOpacity.value,
    transform: [{ translateY: particleY.value }],
  }));

  return (
    <TouchableWithoutFeedback onPress={handleTap} accessible={false}>
      <View style={styles.container}>
        <View style={styles.center}>
          {/* Radial bloom halo — soft shadow-based glow */}
          <Animated.View style={[styles.halo, haloStyle]} />

          {/* Expanding pulse rings — two rings, staggered */}
          <PulseRing color={C.green} size={30} from={1} to={8} duration={1800} delay={1000} peakOpacity={0.55} />
          <PulseRing color={C.green} size={30} from={1} to={7} duration={2000} delay={1600} peakOpacity={0.4} />

          {/* The dot itself — the "seed of light" */}
          <Animated.View style={[styles.dot, dotStyle]} />

          {/* Drifting particle */}
          <Animated.View style={[styles.particle, particleStyle]} />
        </View>

        <View style={styles.textWrap}>
          <Animated.Text style={[styles.mainText, textStyle]}>
            NEURRA
          </Animated.Text>
        </View>

        <Animated.View style={[styles.tapWrap, tapStyle]}>
          <Text style={styles.tapText}>tap to continue</Text>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 60,
  },
  center: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The seed dot — tiny, bright.
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.t1,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 10,
  },
  // Shadow-based radial bloom — no filters, Expo Go safe.
  halo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(110,207,154,0.12)',
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 60,
    elevation: 20,
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.green,
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  textWrap: {
    alignItems: 'center',
  },
  mainText: {
    fontFamily: fonts.heading,
    color: C.t1,
    fontSize: 24,
  },
  tapWrap: {
    position: 'absolute',
    bottom: 70,
  },
  tapText: {
    fontFamily: fonts.kova,
    color: C.t3,
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
