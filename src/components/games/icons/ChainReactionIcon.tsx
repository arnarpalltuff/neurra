import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props { size?: number; color?: string; opacity?: number }

export default React.memo(function ChainReactionIcon({ size = 64, color = '#F0B542', opacity = 0.7 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M16 48 L28 16 L40 40 L52 12"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
      <Path
        d="M52 12 L56 20"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={opacity * 0.5}
      />
    </Svg>
  );
});
