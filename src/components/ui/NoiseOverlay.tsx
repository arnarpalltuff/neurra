import React, { useMemo } from 'react';
import { StyleSheet, Platform } from 'react-native';
import Svg, { Defs, Filter, FeTurbulence, FeColorMatrix, Rect } from 'react-native-svg';

/**
 * Full-screen noise texture overlay.
 *
 * Uses SVG feTurbulence to generate organic grain — the #1 technique
 * for breaking the sterile "AI-generated" look in 2026 design.
 *
 * Renders at 3-4% opacity so it's barely visible consciously,
 * but gives the entire app a tactile, film-like quality.
 */
export default function NoiseOverlay() {
  // SVG noise is expensive — web supports feTurbulence, native doesn't.
  // On native we use a simulated grain via many tiny semi-transparent rects.
  if (Platform.OS === 'web') {
    return (
      <Svg style={styles.overlay} pointerEvents="none" width="100%" height="100%">
        <Defs>
          <Filter id="noise" x="0%" y="0%" width="100%" height="100%">
            <FeTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <FeColorMatrix type="saturate" values="0" />
          </Filter>
        </Defs>
        <Rect width="100%" height="100%" filter="url(#noise)" opacity={0.04} />
      </Svg>
    );
  }

  // Native: lightweight pseudo-grain using many tiny random-opacity dots
  // This is a static pattern — no per-frame cost
  return <NativeGrain />;
}

const GRAIN_DOTS = 80;

function NativeGrain() {
  const dots = useMemo(() => {
    const result: { x: number; y: number; opacity: number; size: number }[] = [];
    for (let i = 0; i < GRAIN_DOTS; i++) {
      result.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        opacity: 0.02 + Math.random() * 0.04,
        size: 1 + Math.random() * 2,
      });
    }
    return result;
  }, []);

  return (
    <Svg style={styles.overlay} pointerEvents="none" width="100%" height="100%">
      {dots.map((d, i) => (
        <Rect
          key={i}
          x={`${d.x}%`}
          y={`${d.y}%`}
          width={d.size}
          height={d.size}
          fill="#FFFFFF"
          opacity={d.opacity}
        />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    pointerEvents: 'none',
  },
});
