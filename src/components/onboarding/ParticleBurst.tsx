import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface Particle {
  id: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
  delay: number;
}

function Dot({ p, trigger }: { p: Particle; trigger: number }) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.4);

  useEffect(() => {
    tx.value = 0;
    ty.value = 0;
    opacity.value = 0;
    scale.value = 0.4;

    opacity.value = withTiming(1, { duration: 80, easing: Easing.out(Easing.ease) });
    scale.value = withSpring(1, { damping: 14, stiffness: 180 });
    tx.value = withSpring(p.dx, { damping: 18, stiffness: 90 });
    ty.value = withSpring(p.dy, { damping: 18, stiffness: 90 });
    // Fade out as particles settle.
    opacity.value = withTiming(0, { duration: 900, easing: Easing.in(Easing.cubic) });

    return () => {
      cancelAnimation(tx);
      cancelAnimation(ty);
      cancelAnimation(opacity);
      cancelAnimation(scale);
    };
  }, [trigger, p.dx, p.dy, tx, ty, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.dot,
        {
          width: p.size,
          height: p.size,
          borderRadius: p.size / 2,
          backgroundColor: p.color,
          shadowColor: p.color,
        },
        style,
      ]}
    />
  );
}

interface ParticleBurstProps {
  /** Each increment re-runs the burst. Pass a counter or a timestamp. */
  trigger: number;
  /** How many particles in the burst. */
  count?: number;
  /** Cycle through these colors across particles. */
  colors?: string[];
  /** Max distance (px) particles travel from origin. */
  spread?: number;
  /** Min size of each particle (px). */
  minSize?: number;
  /** Max size of each particle (px). */
  maxSize?: number;
}

/**
 * A one-shot radial particle burst anchored at the parent's center. Place
 * inside a relatively-positioned container and it fires whenever `trigger`
 * changes (including the first render if `trigger > 0`).
 */
export default React.memo(function ParticleBurst({
  trigger,
  count = 10,
  colors = ['#6ECF9A'],
  spread = 80,
  minSize = 4,
  maxSize = 8,
}: ParticleBurstProps) {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const distance = spread * (0.55 + Math.random() * 0.45);
      return {
        id: i,
        dx: Math.cos(angle) * distance,
        dy: Math.sin(angle) * distance,
        size: minSize + Math.random() * (maxSize - minSize),
        color: colors[i % colors.length],
        delay: Math.random() * 60,
      };
    });
    // Re-seed each burst: trigger is a dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, count, spread, minSize, maxSize, colors.join(',')]);

  if (trigger === 0) return null;

  return (
    <View pointerEvents="none" style={styles.container}>
      {particles.map(p => (
        <Dot key={`${trigger}-${p.id}`} p={p} trigger={trigger} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
});
