import React from 'react';
import Svg, { Circle } from 'react-native-svg';

interface PlaceholderIconProps {
  size?: number;
  color?: string;
  opacity?: number;
}

export default React.memo(function PlaceholderIcon({
  size = 64,
  color = '#6ECF9A',
  opacity = 0.7,
}: PlaceholderIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Circle cx={32} cy={32} r={18} stroke={color} strokeWidth={2} opacity={opacity} />
      <Circle cx={32} cy={32} r={8} fill={color} opacity={opacity * 0.4} />
    </Svg>
  );
});
