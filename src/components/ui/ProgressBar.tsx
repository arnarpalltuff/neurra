import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat,
  withSequence, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../../constants/colors';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  animated?: boolean;
  shimmer?: boolean;
  style?: ViewStyle;
}

export default function ProgressBar({
  value,
  max = 100,
  color = C.green,
  height = 6,
  animated = true,
  shimmer = false,
  style,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const fillWidth = useSharedValue(animated ? 0 : pct);
  const shimmerX = useSharedValue(-1);

  useEffect(() => {
    if (animated) {
      fillWidth.value = withTiming(pct, { duration: 600, easing: Easing.out(Easing.exp) });
    } else {
      fillWidth.value = pct;
    }
  }, [pct, animated]);

  useEffect(() => {
    if (shimmer) {
      shimmerX.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.cubic) }),
        -1,
        false,
      );
    }
  }, [shimmer]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value}%` as `${number}%`,
    height,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmer ? 0.15 + (1 + Math.sin(shimmerX.value * Math.PI * 2)) * 0.1 : 0,
  }));

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }, style]}>
      <Animated.View style={[styles.fill, { borderRadius: height / 2 }, fillStyle]}>
        <LinearGradient
          colors={[color, lighten(color, 0.15)] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: C.t1 }, shimmerStyle]} />
      </Animated.View>
    </View>
  );
}

function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xFF) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 0xFF) + Math.round(255 * amount));
  const b = Math.min(255, (num & 0xFF) + Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: C.surface,
    overflow: 'hidden',
  },
  fill: {
    overflow: 'hidden',
  },
});
