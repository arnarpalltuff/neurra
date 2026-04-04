import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';

interface StreakFlameProps {
  streak: number;
  size?: number;
  /** 0-1 urgency dim factor (1 = full brightness, 0 = nearly extinguished) */
  urgencyDim?: number;
}

type FlameTier = 'tiny' | 'small' | 'medium' | 'large' | 'blue' | 'purple' | 'legendary';

function getTier(streak: number): FlameTier {
  if (streak >= 100) return 'legendary';
  if (streak >= 60) return 'purple';
  if (streak >= 30) return 'blue';
  if (streak >= 14) return 'large';
  if (streak >= 7) return 'medium';
  if (streak >= 1) return 'small';
  return 'tiny';
}

const TIER_COLORS: Record<FlameTier, { base: string; tip: string; glow: string }> = {
  tiny: { base: '#FF8C00', tip: '#FFA500', glow: '#FF8C0040' },
  small: { base: '#FF7F00', tip: '#FFB347', glow: '#FF7F0050' },
  medium: { base: '#FF6B00', tip: '#FFD700', glow: '#FFD70060' },
  large: { base: '#FF4500', tip: '#FFD700', glow: '#FFD70070' },
  blue: { base: '#1E90FF', tip: '#FF8C00', glow: '#1E90FF60' },
  purple: { base: '#8A2BE2', tip: '#4169E1', glow: '#8A2BE260' },
  legendary: { base: '#FFFFFF', tip: '#FFD700', glow: '#FFD70080' },
};

// Ember particle
function Ember({ size, tier, index }: { size: number; tier: FlameTier; index: number }) {
  const y = useSharedValue(0);
  const x = useSharedValue(0);
  const opacity = useSharedValue(0);

  const startDelay = useMemo(() => index * 400 + Math.random() * 600, [index]);
  const drift = useMemo(() => (Math.random() - 0.5) * size * 0.4, [size]);
  const dur = useMemo(() => 1200 + Math.random() * 800, []);

  useEffect(() => {
    const animate = () => {
      y.value = 0;
      x.value = 0;
      opacity.value = 0;

      opacity.value = withSequence(
        withTiming(0.8, { duration: 200 }),
        withTiming(0, { duration: dur - 200 }),
      );
      y.value = withTiming(-size * 1.2, { duration: dur, easing: Easing.out(Easing.cubic) });
      x.value = withTiming(drift, { duration: dur, easing: Easing.inOut(Easing.sin) });
    };

    const timer = setTimeout(animate, startDelay);
    const interval = setInterval(animate, dur);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const tierColor = TIER_COLORS[tier];
  const emberSize = useMemo(() => 2 + Math.random() * 2, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { translateX: x.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: size * 0.3,
          left: size * 0.5 - emberSize / 2,
          width: emberSize,
          height: emberSize,
          borderRadius: emberSize / 2,
          backgroundColor: tierColor.tip,
        },
        style,
      ]}
    />
  );
}

export default function StreakFlame({ streak, size = 24, urgencyDim = 1 }: StreakFlameProps) {
  const tier = getTier(streak);
  const tierColors = TIER_COLORS[tier];

  // Flicker animation
  const flicker = useSharedValue(1);
  const sway = useSharedValue(0);

  const flickerSpeed = tier === 'tiny' || tier === 'small' ? 800 : tier === 'medium' ? 600 : 400;
  const flickerRange = tier === 'tiny' || tier === 'small' ? 0.08 : tier === 'medium' ? 0.12 : 0.15;
  const swayRange = tier === 'tiny' || tier === 'small' ? 2 : tier === 'medium' ? 3 : 4;

  useEffect(() => {
    flicker.value = withRepeat(
      withSequence(
        withTiming(1 - flickerRange, { duration: flickerSpeed, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: flickerSpeed * 0.8, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    sway.value = withRepeat(
      withSequence(
        withTiming(swayRange, { duration: flickerSpeed * 1.5, easing: Easing.inOut(Easing.sin) }),
        withTiming(-swayRange, { duration: flickerSpeed * 1.5, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [tier]);

  const flameStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleY: flicker.value },
      { rotate: `${sway.value}deg` },
    ],
    opacity: urgencyDim,
  }));

  // Number of embers based on tier (capped at 3 for performance)
  const emberCount = tier === 'tiny' ? 0 : tier === 'small' ? 0 : tier === 'medium' ? 1 : tier === 'large' ? 2 : 3;

  // Flame shape: oval with gradient-like layering
  const flameH = size * 0.8;
  const flameW = size * 0.5;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* Glow */}
      <View
        style={[
          styles.glow,
          {
            width: size * 1.4,
            height: size * 1.4,
            borderRadius: size * 0.7,
            backgroundColor: tierColors.glow,
            opacity: urgencyDim * 0.5,
            top: -size * 0.2,
            left: -size * 0.2,
          },
        ]}
      />

      {/* Flame body */}
      <Animated.View style={[{ alignItems: 'center' }, flameStyle]}>
        {/* Outer flame */}
        <View
          style={{
            width: flameW,
            height: flameH,
            borderTopLeftRadius: flameW * 0.5,
            borderTopRightRadius: flameW * 0.5,
            borderBottomLeftRadius: flameW * 0.3,
            borderBottomRightRadius: flameW * 0.3,
            backgroundColor: tierColors.base,
          }}
        />
        {/* Inner flame (tip) */}
        <View
          style={{
            position: 'absolute',
            bottom: flameH * 0.15,
            width: flameW * 0.55,
            height: flameH * 0.6,
            borderTopLeftRadius: flameW * 0.3,
            borderTopRightRadius: flameW * 0.3,
            borderBottomLeftRadius: flameW * 0.2,
            borderBottomRightRadius: flameW * 0.2,
            backgroundColor: tierColors.tip,
          }}
        />
      </Animated.View>

      {/* Embers */}
      {Array.from({ length: emberCount }, (_, i) => (
        <Ember key={i} size={size} tier={tier} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
  },
});
