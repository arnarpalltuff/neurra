import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props { size?: number; color?: string; opacity?: number }

export default React.memo(function RewindIcon({ size = 64, color = '#6ECF9A', opacity = 0.7 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M38 16 L22 32 L38 48"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
      <Path
        d="M42 24 A14 14 0 1 1 42 40"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={opacity * 0.4}
        fill="none"
      />
    </Svg>
  );
});
