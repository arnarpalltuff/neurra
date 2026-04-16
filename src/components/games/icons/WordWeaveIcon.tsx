import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface WordWeaveIconProps {
  size?: number;
  color?: string;
  opacity?: number;
}

/**
 * Lattice of three intersecting letterform strokes — the first letter of
 * "Word Weave" abstracted into a grid-like pattern. Stroke-based so it
 * stays crisp at any card size.
 */
export default React.memo(function WordWeaveIcon({
  size = 64,
  color = '#E09B6B',
  opacity = 0.7,
}: WordWeaveIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* W-like diagonal lattice */}
      <Path
        d="M8 16 L20 48 L32 24 L44 48 L56 16"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
      {/* Horizontal weave strokes */}
      <Path
        d="M12 28 L52 28"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={opacity * 0.5}
      />
      <Path
        d="M16 38 L48 38"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={opacity * 0.5}
      />
      {/* Grid dots suggesting the letter lattice */}
      <Path
        d="M20 28 m-1.5,0 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0"
        fill={color}
        opacity={opacity * 0.6}
      />
      <Path
        d="M32 28 m-1.5,0 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0"
        fill={color}
        opacity={opacity * 0.6}
      />
      <Path
        d="M44 28 m-1.5,0 a1.5,1.5 0 1,0 3,0 a1.5,1.5 0 1,0 -3,0"
        fill={color}
        opacity={opacity * 0.6}
      />
    </Svg>
  );
});
