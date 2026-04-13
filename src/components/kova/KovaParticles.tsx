import React, { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withDelay, Easing, interpolate,
} from 'react-native-reanimated';
import type { KovaEmotion } from '../../stores/kovaStore';

interface KovaParticlesProps {
  emotion: string;
  primaryColor: string;
  size: number;
  glowIntensity: number;
}

const PARTICLE_COUNT = 8;

function Particle({
  index, color, size, rate, emotion,
}: {
  index: number; color: string; size: number; rate: number; emotion: string;
}) {
  const prog = useSharedValue(0);
  const drift = useSharedValue(0);

  const startX = useMemo(() => (Math.random() - 0.5) * size * 0.6, [size]);
  const dur = useMemo(() => 2000 + Math.random() * 2000, []);
  const delay = useMemo(() => index * (1000 / Math.max(rate, 1)) + Math.random() * 500, [index, rate]);
  const driftAmt = useMemo(() => (Math.random() - 0.5) * 20, []);
  const particleSize = useMemo(() => 2 + Math.random() * 3, []);

  useEffect(() => {
    if (rate <= 0) return;
    prog.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: dur, easing: Easing.out(Easing.cubic) }),
        -1, false,
      ),
    );
    drift.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: dur * 0.6, easing: Easing.inOut(Easing.sin) }),
          withTiming(-1, { duration: dur * 0.6, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, true,
      ),
    );
  }, [rate]);

  const style = useAnimatedStyle(() => {
    if (rate <= 0) return { opacity: 0 };
    const t = prog.value;
    return {
      opacity: interpolate(t, [0, 0.1, 0.7, 1], [0, 0.8, 0.4, 0]),
      transform: [
        { translateX: startX + drift.value * driftAmt },
        { translateY: interpolate(t, [0, 1], [0, -size * 0.8]) },
        { scale: interpolate(t, [0, 0.3, 1], [0.3, 1, 0.5]) },
      ],
    };
  });

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        width: particleSize,
        height: particleSize,
        borderRadius: particleSize / 2,
        backgroundColor: color,
        bottom: size * 0.3,
        left: size / 2,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 3,
      }, style]}
      pointerEvents="none"
    />
  );
}

/**
 * Particle system that emits luminous dots upward from Kova's body.
 * Rate and intensity are driven by Kova's emotional state.
 */
export default function KovaParticles({ emotion, primaryColor, size, glowIntensity }: KovaParticlesProps) {
  // Particle emission rate based on emotion
  const rate: number =
    emotion === 'sad' ? 0 :
    emotion === 'lonely' ? 0 :
    emotion === 'recovering' ? 1 :
    emotion === 'idle' ? 1 :
    emotion === 'happy' ? 3 :
    emotion === 'excited' ? 5 :
    emotion === 'proud' ? 5 :
    2;

  const particles = useMemo(() => Array.from({ length: PARTICLE_COUNT }, (_, i) => i), []);

  return (
    <>
      {particles.map(i => (
        <Particle
          key={i}
          index={i}
          color={primaryColor}
          size={size}
          rate={rate}
          emotion={emotion}
        />
      ))}
    </>
  );
}
