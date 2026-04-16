import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat,
  withSequence, Easing,
} from 'react-native-reanimated';
import { type BrainArea, AREA_COLORS } from '../../constants/gameConfigs';

const COLORS = {
  ...AREA_COLORS,
  inactive: '#1B2136',
  connection: 'rgba(255,255,255,0.06)',
  connectionActive: 'rgba(255,255,255,0.15)',
};

interface NeuralMapProps {
  activeAreas: BrainArea[];
  pulseArea?: BrainArea | null;
  intensity?: number;
  size?: number;
}

const NODE_POSITIONS: Record<BrainArea, { x: number; y: number }> = {
  memory:      { x: 0.50, y: 0.08 },
  focus:       { x: 0.92, y: 0.38 },
  speed:       { x: 0.76, y: 0.88 },
  flexibility: { x: 0.24, y: 0.88 },
  creativity:  { x: 0.08, y: 0.38 },
};

const CONNECTIONS: [BrainArea, BrainArea][] = [
  ['memory', 'focus'],
  ['focus', 'speed'],
  ['speed', 'flexibility'],
  ['flexibility', 'creativity'],
  ['creativity', 'memory'],
  ['memory', 'speed'],
  ['memory', 'flexibility'],
  ['focus', 'flexibility'],
  ['focus', 'creativity'],
  ['speed', 'creativity'],
];

const AREAS: BrainArea[] = ['memory', 'focus', 'speed', 'flexibility', 'creativity'];

// ─────────────────────────────────────────────────────────────
// Node
// ─────────────────────────────────────────────────────────────
const NeuralNode = React.memo(function NeuralNode({
  area, isActive, isPulsing, intensity, size,
}: {
  area: BrainArea; isActive: boolean; isPulsing: boolean; intensity: number; size: number;
}) {
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(isActive ? 0.4 + intensity * 0.4 : 0.1);
  const nodeSize = size * 0.14;
  const breathDur = useMemo(() => 1800 + Math.random() * 400, []);

  // Breath loop tied only to isActive — intensity changes don't restart it.
  useEffect(() => {
    if (isActive) {
      pulseScale.value = withRepeat(
        withTiming(1.15, { duration: breathDur, easing: Easing.inOut(Easing.sin) }),
        -1, true,
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [isActive]);

  // Glow level reacts to intensity without restarting breath.
  useEffect(() => {
    glowOpacity.value = withTiming(isActive ? 0.4 + intensity * 0.4 : 0.1, { duration: 300 });
  }, [isActive, intensity]);

  useEffect(() => {
    if (isPulsing) {
      pulseScale.value = withSequence(
        withTiming(1.8, { duration: 150, easing: Easing.out(Easing.quad) }),
        withTiming(1.15, { duration: 400, easing: Easing.inOut(Easing.sin) }),
      );
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0.4 + intensity * 0.4, { duration: 500 }),
      );
    }
  }, [isPulsing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: glowOpacity.value,
  }));

  const pos = NODE_POSITIONS[area];
  const color = COLORS[area];

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: pos.x * size - nodeSize / 2,
          top: pos.y * size - nodeSize / 2,
          width: nodeSize,
          height: nodeSize,
          borderRadius: nodeSize / 2,
          backgroundColor: isActive ? color : COLORS.inactive,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: isActive ? nodeSize * 0.9 : 0,
          shadowOpacity: isActive ? 0.9 : 0,
          elevation: isActive ? 8 : 0,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
});

const ConnectionLine = React.memo(function ConnectionLine({
  from, to, isActive, size,
}: {
  from: BrainArea; to: BrainArea; isActive: boolean; size: number;
}) {
  const posFrom = NODE_POSITIONS[from];
  const posTo = NODE_POSITIONS[to];

  const x1 = posFrom.x * size;
  const y1 = posFrom.y * size;
  const x2 = posTo.x * size;
  const y2 = posTo.y * size;

  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <View
      style={{
        position: 'absolute',
        left: midX - length / 2,
        top: midY - 0.5,
        width: length,
        height: 1,
        backgroundColor: isActive ? COLORS.connectionActive : COLORS.connection,
        transform: [{ rotate: `${angle}deg` }],
      }}
      pointerEvents="none"
    />
  );
});

export default function NeuralMap({
  activeAreas, pulseArea = null, intensity = 0.5, size = 80,
}: NeuralMapProps) {
  const activeSet = useMemo(() => new Set(activeAreas), [activeAreas]);

  return (
    <View
      style={{ width: size, height: size }}
      pointerEvents="none"
    >
      {/* Background glow */}
      <View
        style={{
          position: 'absolute',
          width: size * 0.6,
          height: size * 0.6,
          left: size * 0.2,
          top: size * 0.2,
          borderRadius: size * 0.3,
          backgroundColor: activeAreas.length > 0 ? COLORS[activeAreas[0]] : COLORS.inactive,
          opacity: 0.05 + intensity * 0.08,
        }}
      />

      {/* Connections */}
      {CONNECTIONS.map(([from, to]) => (
        <ConnectionLine
          key={`${from}-${to}`}
          from={from}
          to={to}
          isActive={activeSet.has(from) && activeSet.has(to)}
          size={size}
        />
      ))}

      {/* Nodes */}
      {AREAS.map((area) => (
        <NeuralNode
          key={area}
          area={area}
          isActive={activeSet.has(area)}
          isPulsing={pulseArea === area}
          intensity={intensity}
          size={size}
        />
      ))}
    </View>
  );
}
