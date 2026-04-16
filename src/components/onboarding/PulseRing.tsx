import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface PulseRingProps {
  color: string;
  size?: number;
  /** Ring start scale. */
  from?: number;
  /** Ring end scale. */
  to?: number;
  /** Milliseconds per expansion. */
  duration?: number;
  /** Milliseconds before the first pulse starts. */
  delay?: number;
  /** Loop forever if true, single pulse if false. */
  repeat?: boolean;
  /** Peak opacity at the start of the expansion. */
  peakOpacity?: number;
  strokeWidth?: number;
}

export default React.memo(function PulseRing({
  color,
  size = 40,
  from = 1,
  to = 8,
  duration = 1800,
  delay = 0,
  repeat = true,
  peakOpacity = 0.5,
  strokeWidth = 1,
}: PulseRingProps) {
  const scale = useSharedValue(from);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const expandScale = withTiming(to, { duration, easing: Easing.out(Easing.cubic) });
    const expandOpacity = withSequence(
      withTiming(peakOpacity, { duration: duration * 0.25, easing: Easing.out(Easing.ease) }),
      withTiming(0, { duration: duration * 0.75, easing: Easing.in(Easing.cubic) }),
    );

    if (repeat) {
      scale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(from, { duration: 0 }),
            expandScale,
          ),
          -1,
          false,
        ),
      );
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0, { duration: 0 }),
            expandOpacity,
          ),
          -1,
          false,
        ),
      );
    } else {
      scale.value = withDelay(delay, expandScale);
      opacity.value = withDelay(delay, expandOpacity);
    }

    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [from, to, duration, delay, repeat, peakOpacity, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          borderWidth: strokeWidth,
        },
        style,
      ]}
    />
  );
});

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
  },
});
