import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient as SvgRadialGradient, Stop, Rect, Circle } from 'react-native-svg';
import { GROVE_PALETTES } from '../../constants/groveThemes';
import { useGroveStore } from '../../stores/groveStore';

interface GroveAtmosphereProps {
  /** Width of the scene to cover. */
  width: number;
  /** Height of the scene to cover. */
  height: number;
}

/** Deterministic-ish noise pattern — same dots every render so it doesn't churn. */
const NOISE_DOTS = Array.from({ length: 140 }, (_, i) => {
  // LCG-ish pseudo-random keyed on index — stable across renders.
  const sx = ((i * 1664525 + 1013904223) % 1000) / 1000;
  const sy = ((i * 22695477 + 1) % 1000) / 1000;
  const sr = ((i * 48271) % 100) / 100;
  return { x: sx, y: sy, r: 0.6 + sr * 1.2 };
});

export default React.memo(function GroveAtmosphere({ width, height }: GroveAtmosphereProps) {
  const activeTheme = useGroveStore(s => s.activeTheme);
  const palette = GROVE_PALETTES[activeTheme] ?? GROVE_PALETTES['floating-isle'];

  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 30000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-5, { duration: 30000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    return () => cancelAnimation(drift);
  }, [drift]);

  const driftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value }],
  }));

  const primary = palette.ambientLight;
  const secondary = palette.crystalGlow;

  // Centered primary radial + off-center secondary radial.
  const primaryR = Math.max(width, height) * 0.4;
  const secondaryR = Math.max(width, height) * 0.22;

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { width, height }, driftStyle]}
    >
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <SvgRadialGradient id="ambientPrimary" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={primary} stopOpacity={0.08} />
            <Stop offset="70%" stopColor={primary} stopOpacity={0.02} />
            <Stop offset="100%" stopColor={primary} stopOpacity={0} />
          </SvgRadialGradient>
          <SvgRadialGradient id="ambientSecondary" cx="15%" cy="80%" r="35%">
            <Stop offset="0%" stopColor={secondary} stopOpacity={0.05} />
            <Stop offset="100%" stopColor={secondary} stopOpacity={0} />
          </SvgRadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#ambientPrimary)" />
        <Rect x={0} y={0} width={width} height={height} fill="url(#ambientSecondary)" />
        {/* Noise texture */}
        {NOISE_DOTS.map((d, i) => (
          <Circle
            key={i}
            cx={d.x * width}
            cy={d.y * height}
            r={d.r}
            fill={primary}
            opacity={0.08}
          />
        ))}
      </Svg>

      {/* Vignette — edges darken slightly to focus attention centrally. */}
      <LinearGradient
        colors={['rgba(0,0,0,0.10)', 'transparent']}
        style={[styles.edge, { width, top: 0, height: 80 }]}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.12)']}
        style={[styles.edge, { width, bottom: 0, height: 120 }]}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  edge: {
    position: 'absolute',
    left: 0,
  },
});
