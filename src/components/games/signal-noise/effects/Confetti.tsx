import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing, interpolate,
} from 'react-native-reanimated';
import { C } from '../../../../constants/colors';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Confetti burst for streak milestones
// ─────────────────────────────────────────────────────────────
export const CONFETTI_COLORS = [C.blue, C.green, C.amber, C.purple, '#5CAAC9', C.peach];

export function ConfettiPiece({
  angle, dist, rotate, delay, color,
}: { angle: number; dist: number; rotate: number; delay: number; color: string }) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withDelay(delay, withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }));
  }, []);
  const style = useAnimatedStyle(() => {
    const rad = (angle * Math.PI) / 180;
    const dx = Math.cos(rad) * dist * prog.value;
    const dy = Math.sin(rad) * dist * prog.value + prog.value * prog.value * 200;
    return {
      transform: [{ translateX: dx }, { translateY: dy }, { rotate: `${rotate * prog.value * 4}deg` }],
      opacity: interpolate(prog.value, [0, 0.08, 0.85, 1], [0, 1, 1, 0]),
    };
  });
  return (
    <Animated.View
      style={[{ position: 'absolute', width: 7, height: 12, backgroundColor: color, borderRadius: 2 }, style]}
      pointerEvents="none"
    />
  );
}

export function ConfettiBurst({ onDone }: { onDone: () => void }) {
  const pieces = useMemo(() => Array.from({ length: 36 }, () => ({
    angle: -90 + (Math.random() - 0.5) * 160,
    dist: 80 + Math.random() * 160,
    rotate: (Math.random() - 0.5) * 900,
    delay: Math.random() * 120,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  })), []);
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={styles.confettiOrigin} pointerEvents="none">
      {pieces.map((p, i) => <ConfettiPiece key={i} {...p} />)}
    </View>
  );
}
