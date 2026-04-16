import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface FloatingParticlesProps {
  count?: number;
  color?: string;
}

function FloatingDot({ index, color }: { index: number; color: string }) {
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);

  const startX = useMemo(() => Math.random() * width, []);
  const startY = useMemo(() => Math.random() * height, []);
  const drift = useMemo(() => 40 + Math.random() * 60, []);
  const dur = useMemo(() => 4000 + Math.random() * 4000, []);
  const delay = useMemo(() => index * 800, [index]);
  const size = useMemo(() => 3 + Math.random() * 4, []);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-drift, { duration: dur, easing: Easing.inOut(Easing.sin) }),
          withTiming(drift, { duration: dur, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.4, { duration: dur * 0.8, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.1, { duration: dur * 0.8, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

function FloatingParticles({ count = 8, color = '#7DD3A840' }: FloatingParticlesProps) {
  const dots = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);

  return (
    <>
      {dots.map((i) => (
        <FloatingDot key={i} index={i} color={color} />
      ))}
    </>
  );
}

export default React.memo(FloatingParticles);
