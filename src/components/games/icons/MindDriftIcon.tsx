import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface Props { size?: number; color?: string; opacity?: number }

export default React.memo(function MindDriftIcon({ size = 64, color = '#6ECF9A', opacity = 0.7 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M12 48 Q20 20, 32 36 Q44 52, 52 16"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={opacity}
        fill="none"
      />
      <Circle cx={12} cy={48} r={3} fill={color} opacity={opacity * 0.4} />
      <Circle cx={52} cy={16} r={3.5} fill={color} opacity={opacity} />
    </Svg>
  );
});
