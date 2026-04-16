import React from 'react';
import Svg, { Circle } from 'react-native-svg';

interface Props { size?: number; color?: string; opacity?: number }

export default React.memo(function ZenFlowIcon({ size = 64, color = '#6BA8E0', opacity = 0.7 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Circle
        cx={32}
        cy={32}
        r={22}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="6 4"
        opacity={opacity * 0.45}
      />
      <Circle cx={32} cy={32} r={10} stroke={color} strokeWidth={2} opacity={opacity} />
    </Svg>
  );
});
