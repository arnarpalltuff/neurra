import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface Props { size?: number; color?: string; opacity?: number }

export default React.memo(function SplitFocusIcon({ size = 64, color = '#9B72E0', opacity = 0.7 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Circle cx={32} cy={48} r={3} fill={color} opacity={opacity} />
      <Path
        d="M32 44 L32 28 L18 14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
      <Path
        d="M32 28 L46 14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={opacity * 0.55}
      />
    </Svg>
  );
});
