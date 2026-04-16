import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import ZoneParticle from './ZoneParticle';

export type ZoneHealth = 'thriving' | 'healthy' | 'wilting';

interface ZoneGlowProps {
  accent: string;
  health: ZoneHealth;
  size?: number;
  children: React.ReactNode;
}

/**
 * Wraps a zone with breathing ambient glow + drifting particles behind its
 * visual. Healthy/thriving pulse; wilting goes static with reduced opacity.
 */
export default React.memo(function ZoneGlow({
  accent,
  health,
  size = 100,
  children,
}: ZoneGlowProps) {
  // Per-instance randomized timing so zones don't sync.
  const seed = useRef(Math.random()).current;
  const pulseDur = 2200 + Math.floor(seed * 1800);
  const pulsePeak = health === 'thriving' ? 0.18 : 0.12;
  const pulseTrough = health === 'thriving' ? 0.06 : 0.04;

  const pulse = useSharedValue(pulseTrough);

  useEffect(() => {
    cancelAnimation(pulse);
    if (health === 'wilting') {
      pulse.value = withTiming(0, { duration: 400 });
      return;
    }
    pulse.value = withDelay(
      Math.floor(seed * 1500),
      withRepeat(
        withSequence(
          withTiming(pulsePeak, { duration: pulseDur, easing: Easing.inOut(Easing.sin) }),
          withTiming(pulseTrough, { duration: pulseDur, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(pulse);
  }, [health, pulseDur, pulsePeak, pulseTrough, pulse, seed]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const particleCount = health === 'thriving' ? 3 : health === 'healthy' ? 2 : 0;
  const particles = useMemo(() => {
    if (particleCount === 0) return [];
    // Deterministic per-instance offsets so particles stay anchored near the zone.
    return Array.from({ length: particleCount }, (_, i) => ({
      offsetX: (size * 0.3) + (i - particleCount / 2) * (size * 0.25) + (seed * 20 - 10),
      startY: size * 0.6 + i * 6,
      delay: i * 2400,
      duration: 16000 + Math.floor(seed * 10000) + i * 1200,
      peak: health === 'thriving' ? 0.3 : 0.2,
    }));
  }, [particleCount, size, seed, health]);

  return (
    <View style={{ width: size, height: size }} pointerEvents="box-none">
      {/* Ambient breathing glow */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: size * 0.7,
            left: -size * 0.2,
            top: -size * 0.2,
            backgroundColor: accent,
            shadowColor: accent,
          },
          glowStyle,
        ]}
      />

      {/* Thin accent-tinted border behind content */}
      {health !== 'wilting' && (
        <View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: `${accent}1A`,
            },
          ]}
        />
      )}

      {particles.map((p, i) => (
        <ZoneParticle
          key={i}
          color={accent}
          offsetX={p.offsetX}
          startY={p.startY}
          delay={p.delay}
          duration={p.duration}
          peak={p.peak}
          size={3}
          rise={50 + (seed * 20)}
        />
      ))}

      <View style={{ width: size, height: size, opacity: health === 'wilting' ? 0.45 : 1 }}>
        {children}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    shadowOpacity: 0.8,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
  },
});
