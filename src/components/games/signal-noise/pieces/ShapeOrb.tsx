import React, { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat,
  withSequence, withDelay, Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { styles } from '../styles';

export type ShapeType = 'circle' | 'square' | 'rounded';

export interface SceneShape {
  id: number;
  x: number;
  y: number;
  r: number;
  color: string;
  opacity: number;
  shapeType: ShapeType;
}

// ─────────────────────────────────────────────────────────────
// SVG shape orb — glass-orb with radial gradient + breathing
// ─────────────────────────────────────────────────────────────
export function ShapeOrb({ shape, index, justChanged }: { shape: SceneShape; index: number; justChanged: boolean }) {
  const sz = shape.r * 2;
  const cr = shape.shapeType === 'circle' ? shape.r
    : shape.shapeType === 'rounded' ? shape.r * 0.3
    : 4;
  const orbId = `orb${shape.id}`;
  const shineId = `shine${shape.id}`;

  const breath = useSharedValue(1);
  const entry = useSharedValue(0);
  const changePulse = useSharedValue(1);
  const breathDur = useMemo(() => 2800 + Math.random() * 1600, []);

  useEffect(() => {
    entry.value = withDelay(
      index * 50,
      withSpring(1, { damping: 12, stiffness: 120 }),
    );
    breath.value = withDelay(
      index * 80 + 600,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: breathDur, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.95, { duration: breathDur, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, true,
      ),
    );
  }, []);

  useEffect(() => {
    if (justChanged) {
      changePulse.value = withSequence(
        withTiming(1.18, { duration: 150, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 8, stiffness: 160 }),
      );
    }
  }, [justChanged]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breath.value * changePulse.value * (0.3 + 0.7 * entry.value) }],
    opacity: shape.opacity * entry.value,
  }));

  return (
    <Animated.View
      style={[styles.shapeWrap, {
        left: shape.x - shape.r,
        top: shape.y - shape.r,
        width: sz,
        height: sz,
        borderRadius: cr,
        shadowColor: shape.color,
      }, animStyle]}
    >
      <Svg width={sz} height={sz} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id={orbId} cx="35%" cy="28%" rx="80%" ry="80%" fx="35%" fy="28%">
            <Stop offset="0%" stopColor={shape.color} stopOpacity="1" />
            <Stop offset="55%" stopColor={shape.color} stopOpacity="0.7" />
            <Stop offset="100%" stopColor="#0A0E18" stopOpacity="0.85" />
          </RadialGradient>
          <RadialGradient id={shineId} cx="32%" cy="24%" rx="42%" ry="42%" fx="32%" fy="24%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        {shape.shapeType === 'circle' ? (
          <>
            <Circle cx={shape.r} cy={shape.r} r={shape.r - 1} fill={`url(#${orbId})`} />
            <Circle cx={shape.r} cy={shape.r} r={shape.r - 3} fill={`url(#${shineId})`} />
          </>
        ) : (
          <>
            <Rect x={1} y={1} width={sz - 2} height={sz - 2} rx={cr} fill={`url(#${orbId})`} />
            <Rect x={3} y={3} width={sz - 6} height={sz - 6} rx={Math.max(0, cr - 2)} fill={`url(#${shineId})`} />
          </>
        )}
      </Svg>
    </Animated.View>
  );
}
