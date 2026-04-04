import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';

const { width: W, height: H } = Dimensions.get('window');
const MAX_PARTICLES = 30;

// ── Types ────────────────────────────────────────────────
export type CelebrationType =
  | 'confetti_standard'
  | 'confetti_mini'
  | 'confetti_epic'
  | 'confetti_gold'
  | 'confetti_rainbow'
  | 'particles_sparkle'
  | 'particles_stars'
  | 'particles_hearts'
  | 'particles_coins'
  | 'particles_fire'
  | 'particles_magic';

interface CelebrationProps {
  type: CelebrationType;
  /** Increment to re-trigger */
  trigger: number;
  /** Origin point for burst-style effects. Defaults to screen center-top. */
  origin?: { x: number; y: number };
}

// ── Config per type ──────────────────────────────────────
interface TypeConfig {
  count: number;
  duration: number;
  palette: string[];
  gravity: number;
  shape: 'rect' | 'circle' | 'star' | 'heart' | 'coin';
  fromTop: boolean; // true = rain from top, false = burst from origin
  sparkleGlow: boolean;
  sizeRange: [number, number];
}

const APP_PALETTE = [colors.growth, colors.streak, colors.coral, colors.lavender, colors.sky, colors.warm];
const GOLD_PALETTE = [colors.nova, colors.streak, '#F59E0B', '#D97706', '#FDE68A'];
const RAINBOW = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8B00FF'];
const WHITE_SPARKLE = ['#FFFFFF', colors.textPrimary, '#F0F0F0', '#D4D4D4'];
const FIRE_PALETTE = ['#FF4500', colors.ember, '#FF8C00', colors.streak, colors.nova];
const MAGIC_PALETTE = [colors.lavender, colors.sky, colors.growth, colors.streak, colors.coral, colors.nova];

const TYPE_CONFIGS: Record<CelebrationType, TypeConfig> = {
  confetti_standard: { count: 30, duration: 3000, palette: APP_PALETTE, gravity: 1, shape: 'rect', fromTop: true, sparkleGlow: false, sizeRange: [6, 12] },
  confetti_mini: { count: 15, duration: 2000, palette: APP_PALETTE, gravity: 0.6, shape: 'rect', fromTop: false, sparkleGlow: false, sizeRange: [4, 8] },
  confetti_epic: { count: 30, duration: 4000, palette: APP_PALETTE, gravity: 0.8, shape: 'rect', fromTop: true, sparkleGlow: true, sizeRange: [6, 14] },
  confetti_gold: { count: 30, duration: 3000, palette: GOLD_PALETTE, gravity: 1, shape: 'rect', fromTop: true, sparkleGlow: true, sizeRange: [6, 12] },
  confetti_rainbow: { count: 35, duration: 3500, palette: RAINBOW, gravity: 0.9, shape: 'rect', fromTop: true, sparkleGlow: false, sizeRange: [6, 12] },
  particles_sparkle: { count: 20, duration: 2000, palette: WHITE_SPARKLE, gravity: 0.2, shape: 'circle', fromTop: false, sparkleGlow: true, sizeRange: [3, 6] },
  particles_stars: { count: 15, duration: 2500, palette: GOLD_PALETTE, gravity: -0.3, shape: 'star', fromTop: false, sparkleGlow: true, sizeRange: [8, 14] },
  particles_hearts: { count: 12, duration: 3000, palette: [colors.coral, '#FF69B4', '#FF1493'], gravity: -0.5, shape: 'heart', fromTop: false, sparkleGlow: false, sizeRange: [8, 14] },
  particles_coins: { count: 15, duration: 2500, palette: GOLD_PALETTE, gravity: 1.2, shape: 'coin', fromTop: true, sparkleGlow: true, sizeRange: [10, 16] },
  particles_fire: { count: 20, duration: 2500, palette: FIRE_PALETTE, gravity: -0.8, shape: 'circle', fromTop: false, sparkleGlow: true, sizeRange: [4, 8] },
  particles_magic: { count: 25, duration: 3000, palette: MAGIC_PALETTE, gravity: 0, shape: 'circle', fromTop: false, sparkleGlow: true, sizeRange: [4, 10] },
};

// ── Particle seed ────────────────────────────────────────
interface ParticleSeed {
  color: string;
  size: number;
  startX: number;
  startY: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  delay: number;
}

function generateSeeds(config: TypeConfig, origin: { x: number; y: number }): ParticleSeed[] {
  const count = Math.min(config.count, MAX_PARTICLES);
  return Array.from({ length: count }, (_, i) => {
    const color = config.palette[i % config.palette.length];
    const size = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 120;

    let startX: number;
    let startY: number;
    let velocityX: number;
    let velocityY: number;

    if (config.fromTop) {
      startX = Math.random() * W;
      startY = -20 - Math.random() * 40;
      velocityX = (Math.random() - 0.5) * 80;
      velocityY = 100 + Math.random() * 150;
    } else {
      startX = origin.x;
      startY = origin.y;
      velocityX = Math.cos(angle) * speed;
      velocityY = Math.sin(angle) * speed;
    }

    return {
      color,
      size,
      startX,
      startY,
      velocityX,
      velocityY,
      rotation: (Math.random() - 0.5) * 720,
      delay: Math.random() * (config.duration * 0.2),
    };
  });
}

// ── Single particle ──────────────────────────────────────
function CelebrationParticle({
  seed,
  config,
  trigger,
}: {
  seed: ParticleSeed;
  config: TypeConfig;
  trigger: number;
}) {
  const x = useSharedValue(seed.startX);
  const y = useSharedValue(seed.startY);
  const rot = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (trigger === 0) return;

    // Reset
    x.value = seed.startX;
    y.value = seed.startY;
    rot.value = 0;
    opacity.value = 0;
    scale.value = 1;

    const dur = config.duration - seed.delay;
    const gravityOffset = config.gravity * 200;

    // Animate position with physics approximation
    x.value = withDelay(seed.delay, withTiming(
      seed.startX + seed.velocityX + (Math.random() - 0.5) * 40,
      { duration: dur, easing: Easing.out(Easing.cubic) },
    ));
    y.value = withDelay(seed.delay, withTiming(
      seed.startY + seed.velocityY + gravityOffset,
      { duration: dur, easing: config.gravity > 0 ? Easing.in(Easing.quad) : Easing.out(Easing.cubic) },
    ));

    // Rotation
    rot.value = withDelay(seed.delay, withTiming(
      seed.rotation,
      { duration: dur, easing: Easing.linear },
    ));

    // Opacity: appear quickly, hold, then fade out in last 40%
    opacity.value = withDelay(seed.delay, withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(1, { duration: dur * 0.6 - 100 }),
      withTiming(0, { duration: dur * 0.4 }),
    ));

    // Scale: shrink to 0 over duration
    scale.value = withDelay(seed.delay, withTiming(0, { duration: dur, easing: Easing.in(Easing.cubic) }));
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${rot.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  // Shape rendering
  const shapeStyle = useMemo(() => {
    const base = {
      width: seed.size,
      height: seed.size,
      backgroundColor: seed.color,
    };

    switch (config.shape) {
      case 'circle':
        return { ...base, borderRadius: seed.size / 2 };
      case 'rect':
        return { ...base, height: seed.size * 0.6, borderRadius: 2 };
      case 'coin':
        return { ...base, borderRadius: seed.size / 2, borderWidth: 1, borderColor: '#B8860B' };
      case 'heart':
      case 'star':
        // Approximate with circles
        return { ...base, borderRadius: seed.size / 2 };
      default:
        return { ...base, borderRadius: 2 };
    }
  }, [seed.size, seed.color, config.shape]);

  const glowStyle = config.sparkleGlow ? {
    shadowColor: seed.color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  } : {};

  return (
    <Animated.View
      style={[
        { position: 'absolute', left: 0, top: 0 },
        style,
      ]}
      pointerEvents="none"
    >
      <View style={[shapeStyle, glowStyle]} />
    </Animated.View>
  );
}

// ── Screen glow for epic types ───────────────────────────
function ScreenGlow({ trigger, duration, color }: { trigger: number; duration: number; color: string }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    opacity.value = withTiming(0.15, { duration: 300 });
    opacity.value = withDelay(duration * 0.5, withTiming(0, { duration: duration * 0.5 }));
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: color }, style]}
      pointerEvents="none"
    />
  );
}

// ── Main Celebration Component ───────────────────────────
export default function Celebration({ type, trigger, origin }: CelebrationProps) {
  const config = TYPE_CONFIGS[type];
  const defaultOrigin = { x: W / 2, y: H * 0.3 };
  const o = origin ?? defaultOrigin;

  const seeds = useMemo(
    () => trigger > 0 ? generateSeeds(config, o) : [],
    [trigger, type],
  );

  if (trigger === 0 || seeds.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {config.sparkleGlow && (
        <ScreenGlow trigger={trigger} duration={config.duration} color={config.palette[0]} />
      )}
      {seeds.map((seed, i) => (
        <CelebrationParticle key={i} seed={seed} config={config} trigger={trigger} />
      ))}
    </View>
  );
}
