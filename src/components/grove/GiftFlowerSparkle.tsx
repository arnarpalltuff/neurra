import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { C } from '../../constants/colors';
import { fonts } from '../../constants/typography';

interface GiftFlowerSparkleProps {
  fromName: string;
  x: number;
  y: number;
  placedAt: string;
}

const SPARKLE_OFFSETS = [
  { dx: 0, dy: -14, delay: 0 },
  { dx: 12, dy: 0, delay: 380 },
  { dx: 0, dy: 14, delay: 760 },
  { dx: -12, dy: 0, delay: 1140 },
];

function Sparkle({ dx, dy, delay }: { dx: number; dy: number; delay: number }) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.9, { duration: 500, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) }),
          withTiming(0, { duration: 500 }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(opacity);
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.sparkle,
        { left: dx, top: dy },
        style,
      ]}
    />
  );
}

export default React.memo(function GiftFlowerSparkle({
  fromName, x, y, placedAt,
}: GiftFlowerSparkleProps) {
  const scale = useSharedValue(0);
  const bornRecently = useRef(false);

  useEffect(() => {
    const placedMs = new Date(placedAt).getTime();
    const ageMs = Date.now() - placedMs;
    // Treat gifts received in the last 10s as "new" → spring entrance.
    if (ageMs < 10_000) {
      bornRecently.current = true;
      scale.value = 0;
      scale.value = withSequence(
        withSpring(1.1, { damping: 10, stiffness: 180 }),
        withSpring(1, { damping: 12, stiffness: 140 }),
      );
    } else {
      scale.value = withTiming(1, { duration: 0 });
    }
  }, [placedAt, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.wrap, { left: x, top: y }]} pointerEvents="none">
      <Animated.View style={[styles.flowerWrap, style]}>
        {SPARKLE_OFFSETS.map((s, i) => (
          <Sparkle key={i} dx={s.dx} dy={s.dy} delay={s.delay} />
        ))}
        <Text style={styles.flower}>🌸</Text>
      </Animated.View>
      <Text style={styles.label} numberOfLines={1}>from {fromName}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  flowerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    shadowColor: C.peach,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  flower: {
    fontSize: 20,
  },
  sparkle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.peach,
    shadowColor: C.peach,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 9,
    color: C.t2,
    marginTop: 2,
    backgroundColor: 'rgba(19,24,41,0.85)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
    letterSpacing: 0.2,
  },
});
