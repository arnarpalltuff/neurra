import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface Props { size?: number; color?: string; opacity?: number }

export default React.memo(function FacePlaceIcon({ size = 64, color = '#6ECF9A', opacity = 0.7 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Circle cx={32} cy={28} r={16} stroke={color} strokeWidth={2} opacity={opacity} />
      <Circle cx={26} cy={26} r={2} fill={color} opacity={opacity * 0.6} />
      <Circle cx={38} cy={26} r={2} fill={color} opacity={opacity * 0.6} />
      <Path
        d="M26 34 Q32 40 38 34"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={opacity * 0.5}
        fill="none"
      />
    </Svg>
  );
});
