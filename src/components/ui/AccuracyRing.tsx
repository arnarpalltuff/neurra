import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, useAnimatedProps,
  withTiming, withDelay, withSpring, Easing, interpolateColor,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../constants/colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface AccuracyRingProps {
  accuracy: number; // 0–1
  size?: number;
  strokeWidth?: number;
  delay?: number;
  label?: string;
}

export default function AccuracyRing({
  accuracy,
  size = 120,
  strokeWidth = 8,
  delay = 300,
  label = 'Accuracy',
}: AccuracyRingProps) {
  const progress = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.8);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    progress.value = withDelay(delay, withTiming(accuracy, { duration: 1200, easing: Easing.out(Easing.cubic) }));
    textOpacity.value = withDelay(delay + 200, withTiming(1, { duration: 400 }));
    ringScale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 120 }));
  }, [accuracy, delay]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const accPct = Math.round(accuracy * 100);
  const ringColor = accPct >= 90 ? colors.growth : accPct >= 70 ? colors.sky : accPct >= 50 ? colors.warm : colors.coral;

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, containerStyle]}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.bgTertiary}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated foreground */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Animated.View style={[styles.textOverlay, textStyle]}>
        <Text style={[styles.percentText, { color: ringColor }]}>{accPct}%</Text>
        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 28,
    letterSpacing: -1,
  },
  label: {
    fontFamily: 'Nunito_600SemiBold',
    color: colors.textTertiary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
