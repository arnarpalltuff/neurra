import React from 'react';
import Svg, { Rect } from 'react-native-svg';

interface Props { size?: number; color?: string; opacity?: number }

export default React.memo(function SignalNoiseIcon({ size = 64, color = '#6BA8E0', opacity = 0.7 }: Props) {
  const bars = [14, 28, 38, 22, 32, 18, 26];
  const barW = 4;
  const gap = (48 - bars.length * barW) / (bars.length - 1);
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {bars.map((h, i) => {
        const x = 8 + i * (barW + gap);
        const highlighted = i === 2 || i === 4;
        return (
          <Rect
            key={i}
            x={x}
            y={32 - h / 2}
            width={barW}
            height={h}
            rx={2}
            fill={color}
            opacity={highlighted ? opacity : opacity * 0.35}
          />
        );
      })}
    </Svg>
  );
});
