import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props { size?: number; color?: string; opacity?: number }

export default React.memo(function MirrorsIcon({ size = 64, color = '#9B72E0', opacity = 0.7 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M32 8 L52 32 L32 56 L12 32 Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        opacity={opacity}
      />
      <Path
        d="M32 16 L44 32 L32 48 L20 32 Z"
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="4 3"
        strokeLinejoin="round"
        opacity={opacity * 0.5}
      />
    </Svg>
  );
});
