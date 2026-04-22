import React, { useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

const { width: W } = Dimensions.get('window');
const SCENE_SIZE = W - 40;

// ─────────────────────────────────────────────────────────────
// Scene grid — subtle radar-style grid inside the scene
// ─────────────────────────────────────────────────────────────
export function SceneGrid() {
  const lines = useMemo(() => {
    const result: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const step = SCENE_SIZE / 6;
    for (let i = 1; i < 6; i++) {
      result.push({ x1: i * step, y1: 0, x2: i * step, y2: SCENE_SIZE });
      result.push({ x1: 0, y1: i * step, x2: SCENE_SIZE, y2: i * step });
    }
    return result;
  }, []);
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {lines.map((l, i) => (
        <Line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="rgba(92,170,201,0.06)" strokeWidth={0.8} />
      ))}
      <Circle cx={SCENE_SIZE / 2} cy={SCENE_SIZE / 2} r={SCENE_SIZE * 0.35}
        stroke="rgba(92,170,201,0.05)" strokeWidth={0.8} fill="none" />
      <Circle cx={SCENE_SIZE / 2} cy={SCENE_SIZE / 2} r={SCENE_SIZE * 0.18}
        stroke="rgba(92,170,201,0.04)" strokeWidth={0.8} fill="none" />
    </Svg>
  );
}
