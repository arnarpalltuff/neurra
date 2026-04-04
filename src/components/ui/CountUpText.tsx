import React, { useEffect } from 'react';
import { TextInput, TextStyle, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming, withDelay,
  useAnimatedStyle, withSequence, withSpring, Easing,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface CountUpTextProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  delay?: number;
  style?: TextStyle | TextStyle[];
}

export default function CountUpText({
  value,
  prefix = '',
  suffix = '',
  duration = 1000,
  delay: delayMs = 0,
  style,
}: CountUpTextProps) {
  const animValue = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    animValue.value = withDelay(
      delayMs,
      withTiming(value, { duration, easing: Easing.out(Easing.cubic) }),
    );
    // Punch scale at the end of count
    scale.value = withDelay(
      delayMs + duration * 0.8,
      withSequence(
        withSpring(1.15, { damping: 4, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 200 }),
      ),
    );
  }, [value, duration, delayMs]);

  const animatedProps = useAnimatedProps(() => ({
    text: `${prefix}${Math.round(animValue.value)}${suffix}`,
    defaultValue: `${prefix}0${suffix}`,
  }));

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      style={[styles.base, style, animStyle]}
      animatedProps={animatedProps}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    padding: 0,
    // TextInput defaults — override with style prop
  },
});
