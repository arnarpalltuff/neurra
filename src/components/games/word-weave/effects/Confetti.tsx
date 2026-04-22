import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay,
  Easing, interpolate,
} from 'react-native-reanimated';
import { C } from '../../../../constants/colors';
import { styles } from '../styles';

// ─────────────────────────────────────────────────────────────
// Confetti burst — fires on a new best word
// ─────────────────────────────────────────────────────────────
const CONFETTI_COLORS = [C.amber, C.peach, C.green, C.purple, '#FFE8B0', C.blue];

function ConfettiPiece({
  angle, dist, rotate, delay, color,
}: {
  angle: number;
  dist: number;
  rotate: number;
  delay: number;
  color: string;
}) {
  const prog = useSharedValue(0);
  useEffect(() => {
    prog.value = withDelay(
      delay,
      withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) }),
    );
  }, []);
  const style = useAnimatedStyle(() => {
    const rad = (angle * Math.PI) / 180;
    const dx = Math.cos(rad) * dist * prog.value;
    const dy = Math.sin(rad) * dist * prog.value + prog.value * prog.value * 220;
    return {
      transform: [
        { translateX: dx },
        { translateY: dy },
        { rotate: `${rotate * prog.value * 4}deg` },
      ],
      opacity: interpolate(prog.value, [0, 0.08, 0.85, 1], [0, 1, 1, 0]),
    };
  });
  return (
    <Animated.View
      style={[{
        position: 'absolute',
        width: 8,
        height: 14,
        backgroundColor: color,
        borderRadius: 2,
      }, style]}
      pointerEvents="none"
    />
  );
}

export function ConfettiBurst({ onDone }: { onDone: () => void }) {
  const pieces = useMemo(
    () => Array.from({ length: 44 }, () => ({
      angle: -90 + (Math.random() - 0.5) * 160,
      dist: 90 + Math.random() * 180,
      rotate: (Math.random() - 0.5) * 900,
      delay: Math.random() * 140,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    })),
    [],
  );
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={styles.confettiOrigin} pointerEvents="none">
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} {...p} />
      ))}
    </View>
  );
}
