import React, { useEffect, useMemo } from 'react';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate,
} from 'react-native-reanimated';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Correct sparkle — particles burst from the found shape
// ─────────────────────────────────────────────────────────────
export function CorrectSparkle({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const particles = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    angle: (360 / 8) * i + (Math.random() - 0.5) * 30,
    dist: 25 + Math.random() * 35,
  })), []);
  useEffect(() => {
    const t = setTimeout(onDone, 800);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
      {particles.map((p, i) => (
        <SparkleParticle key={i} x={x} y={y} angle={p.angle} dist={p.dist} />
      ))}
    </>
  );
}

function SparkleParticle({ x, y, angle, dist }: { x: number; y: number; angle: number; dist: number }) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, []);
  const style = useAnimatedStyle(() => {
    const rad = (angle * Math.PI) / 180;
    const dx = x + Math.cos(rad) * dist * prog.value - 3;
    const dy = y + Math.sin(rad) * dist * prog.value - 3;
    return {
      transform: [{ translateX: dx }, { translateY: dy }],
      opacity: interpolate(prog.value, [0, 0.15, 0.8, 1], [0, 1, 0.5, 0]),
      width: interpolate(prog.value, [0, 0.3, 1], [2, 6, 2]),
      height: interpolate(prog.value, [0, 0.3, 1], [2, 6, 2]),
    };
  });
  return (
    <Animated.View style={[styles.sparkleParticle, style]} pointerEvents="none" />
  );
}
