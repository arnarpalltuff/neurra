import React, { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface ZoneParticleProps {
  color: string;
  /** X offset from zone center (px). */
  offsetX: number;
  /** Starting Y (px); particle drifts upward from here. */
  startY: number;
  /** Total vertical travel distance (px). */
  rise?: number;
  /** Loop duration (ms). */
  duration?: number;
  /** Stagger start (ms). */
  delay?: number;
  /** Peak opacity during the cycle. */
  peak?: number;
  size?: number;
}

export default React.memo(function ZoneParticle({
  color,
  offsetX,
  startY,
  rise = 60,
  duration = 18000,
  delay = 0,
  peak = 0.25,
  size = 3,
}: ZoneParticleProps) {
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withTiming(-rise, { duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        false,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(peak, { duration: duration * 0.3, easing: Easing.out(Easing.ease) }),
          withTiming(peak * 0.5, { duration: duration * 0.4, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: duration * 0.3, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );

    return () => {
      cancelAnimation(y);
      cancelAnimation(opacity);
    };
  }, [duration, delay, peak, rise, y, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: opacity.value,
  }));

  const baseStyle = useMemo(() => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    left: offsetX,
    top: startY,
    shadowColor: color,
    shadowOpacity: 0.7,
    shadowRadius: size * 2,
    shadowOffset: { width: 0, height: 0 },
  }), [size, color, offsetX, startY]);

  return <Animated.View pointerEvents="none" style={[styles.particle, baseStyle, style]} />;
});

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
  },
});
