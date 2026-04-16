import React from 'react';
import Svg, { Rect, Line } from 'react-native-svg';

interface Props { size?: number; color?: string; opacity?: number }

export default React.memo(function GhostKitchenIcon({ size = 64, color = '#6ECF9A', opacity = 0.7 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Rect x={14} y={12} rx={4} width={30} height={40} stroke={color} strokeWidth={2} opacity={opacity} />
      <Rect x={20} y={16} rx={4} width={30} height={40} stroke={color} strokeWidth={2} opacity={opacity * 0.5} />
      <Line x1={20} y1={26} x2={38} y2={26} stroke={color} strokeWidth={1.5} opacity={opacity * 0.4} strokeLinecap="round" />
      <Line x1={20} y1={34} x2={34} y2={34} stroke={color} strokeWidth={1.5} opacity={opacity * 0.4} strokeLinecap="round" />
    </Svg>
  );
});
